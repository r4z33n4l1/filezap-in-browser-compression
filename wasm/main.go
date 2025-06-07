package main

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"strings"
	"syscall/js"

	"github.com/disintegration/imaging"
)

// Progress callback function type
type ProgressCallback func(progress int)

// Advanced PDF compression function
func compressPDFData(inputBytes []byte, reportProgress func(int)) []byte {
	fmt.Printf("[WASM] compressPDFData: processing %d bytes\n", len(inputBytes))
	
	// Check if it's actually a PDF
	if len(inputBytes) < 4 || string(inputBytes[:4]) != "%PDF" {
		fmt.Printf("[WASM] Not a valid PDF file, returning original\n")
		return inputBytes
	}
	
	reportProgress(20)
	
	// Strategy 1: Remove/compress embedded images (most effective for large PDFs)
	compressed := compressEmbeddedImages(inputBytes)
	fmt.Printf("[WASM] After image compression: %d bytes\n", len(compressed))
	reportProgress(50)
	
	// Strategy 2: Remove metadata and unnecessary objects
	compressed = removeMetadataBinary(compressed)
	fmt.Printf("[WASM] After metadata removal: %d bytes\n", len(compressed))
	reportProgress(70)
	
	// Strategy 3: Compress streams and remove duplicates
	compressed = optimizeStreams(compressed)
	fmt.Printf("[WASM] After stream optimization: %d bytes\n", len(compressed))
	reportProgress(90)
	
	// Calculate compression ratio
	ratio := float64(len(compressed)) / float64(len(inputBytes))
	fmt.Printf("[WASM] Compression ratio: %.3f (%.1f%% reduction)\n", ratio, (1-ratio)*100)
	
	// If we achieved any reduction, use compressed version
	if ratio < 0.95 {
		fmt.Printf("[WASM] Compression successful: %d -> %d bytes\n", len(inputBytes), len(compressed))
		reportProgress(100)
		return compressed
	} else {
		fmt.Printf("[WASM] Compression not effective enough (%.1f%% reduction), returning original to preserve PDF structure\n", (1-ratio)*100)
		reportProgress(100)
		return inputBytes
	}
}

// Compress embedded images in PDF (most effective for large PDFs)
func compressEmbeddedImages(data []byte) []byte {
	fmt.Printf("[WASM] compressEmbeddedImages: scanning PDF structure for images\n")
	
	result := make([]byte, 0, len(data))
	i := 0
	imagesFound := 0
	totalSaved := 0
	
	// Strategy 1: Look for PDF Image XObjects
	content := string(data)
	
	// Find image objects (look for /Type /XObject /Subtype /Image)
	imageObjCount := strings.Count(content, "/Type /XObject")
	imageCount := strings.Count(content, "/Subtype /Image")
	fmt.Printf("[WASM] Found %d XObjects, %d Image subtypes\n", imageObjCount, imageCount)
	
	// Strategy 2: Look for DCTDecode (JPEG) and FlateDecode (compressed) streams
	dctCount := strings.Count(content, "/DCTDecode")
	flateCount := strings.Count(content, "/FlateDecode")
	fmt.Printf("[WASM] Found %d DCTDecode, %d FlateDecode streams\n", dctCount, flateCount)
	
	// Strategy 3: Aggressive binary scan for image markers
	for i < len(data) {
		// Look for JPEG with more flexible markers
		if i < len(data)-2 && data[i] == 0xFF && data[i+1] == 0xD8 {
			// Found JPEG start (more permissive)
			jpegStart := i
			jpegEnd := -1
			
			// Find end of JPEG (FF D9)
			for j := i + 2; j < len(data)-1; j++ {
				if data[j] == 0xFF && data[j+1] == 0xD9 {
					jpegEnd = j + 2
					break
				}
			}
			
			if jpegEnd > 0 && jpegEnd-jpegStart > 1000 { // Only process significant JPEGs
				jpegSize := jpegEnd - jpegStart
				jpegData := data[jpegStart:jpegEnd]
				compressedJpeg := compressJpegData(jpegData)
				
				if len(compressedJpeg) < jpegSize {
					saved := jpegSize - len(compressedJpeg)
					totalSaved += saved
					result = append(result, compressedJpeg...)
					fmt.Printf("[WASM] JPEG #%d compressed: %d -> %d bytes (saved %d)\n", 
						imagesFound+1, jpegSize, len(compressedJpeg), saved)
				} else {
					result = append(result, jpegData...)
				}
				
				imagesFound++
				i = jpegEnd
				continue
			}
		}
		
		// Look for PNG image markers (89 50 4E 47)
		if i < len(data)-7 && data[i] == 0x89 && data[i+1] == 0x50 && 
		   data[i+2] == 0x4E && data[i+3] == 0x47 {
			// Found PNG signature
			pngStart := i
			pngEnd := -1
			
			// Look for PNG end marker (IEND + CRC)
			for j := i + 8; j < len(data)-7; j++ {
				if data[j] == 0x49 && data[j+1] == 0x45 && 
				   data[j+2] == 0x4E && data[j+3] == 0x44 {
					pngEnd = j + 8 // Include CRC
					break
				}
			}
			
			if pngEnd > 0 && pngEnd-pngStart > 1000 { // Only process significant PNGs
				pngSize := pngEnd - pngStart
				pngData := data[pngStart:pngEnd]
				compressedPng := compressPngData(pngData)
				
				if len(compressedPng) < pngSize {
					saved := pngSize - len(compressedPng)
					totalSaved += saved
					result = append(result, compressedPng...)
					fmt.Printf("[WASM] PNG #%d compressed: %d -> %d bytes (saved %d)\n", 
						imagesFound+1, pngSize, len(compressedPng), saved)
				} else {
					result = append(result, pngData...)
				}
				
				imagesFound++
				i = pngEnd
				continue
			}
		}
		
		result = append(result, data[i])
		i++
	}
	
	fmt.Printf("[WASM] Image compression complete: found %d images, saved %d bytes total\n", imagesFound, totalSaved)
	fmt.Printf("[WASM] Overall: %d -> %d bytes (%.1f%% reduction)\n", 
		len(data), len(result), (1.0-float64(len(result))/float64(len(data)))*100)
	return result
}

// Compress JPEG data by removing only safe metadata
func compressJpegData(jpegData []byte) []byte {
	result := make([]byte, 0, len(jpegData))
	i := 0
	bytesRemoved := 0
	
	for i < len(jpegData) {
		if i < len(jpegData)-3 {
			marker := jpegData[i:i+2]
			
			// Only remove safe metadata that won't break PDF structure
			// Be much more conservative to preserve PDF validity
			
			// Remove EXIF data (FF E1) - but only if it's large
			if marker[0] == 0xFF && marker[1] == 0xE1 {
				segmentLength := int(jpegData[i+2])<<8 + int(jpegData[i+3])
				// Only remove large EXIF segments (>10KB) to be safe
				if segmentLength > 10240 {
					fmt.Printf("[WASM] Removing large EXIF segment: %d bytes\n", segmentLength)
					bytesRemoved += 2 + segmentLength
					i += 2 + segmentLength
					continue
				}
			}
			
			// Remove Comment segments (FF FE) - these are usually safe
			if marker[0] == 0xFF && marker[1] == 0xFE {
				segmentLength := int(jpegData[i+2])<<8 + int(jpegData[i+3])
				// Only remove large comments
				if segmentLength > 1024 {
					fmt.Printf("[WASM] Removing large Comment segment: %d bytes\n", segmentLength)
					bytesRemoved += 2 + segmentLength
					i += 2 + segmentLength
					continue
				}
			}
			
			// Remove only very large metadata segments (>20KB)
			if marker[0] == 0xFF && marker[1] >= 0xE2 && marker[1] <= 0xEF {
				segmentLength := int(jpegData[i+2])<<8 + int(jpegData[i+3])
				if segmentLength > 20480 { // Only remove really large metadata
					fmt.Printf("[WASM] Removing large metadata segment 0x%02X: %d bytes\n", marker[1], segmentLength)
					bytesRemoved += 2 + segmentLength
					i += 2 + segmentLength
					continue
				}
			}
		}
		
		result = append(result, jpegData[i])
		i++
	}
	
	// Only return compressed version if we actually saved significant space
	if bytesRemoved > len(jpegData)/20 { // At least 5% reduction
		fmt.Printf("[WASM] JPEG compression: %d -> %d bytes (%.1f%% reduction)\n", 
			len(jpegData), len(result), (1.0-float64(len(result))/float64(len(jpegData)))*100)
		return result
	} else {
		// Not enough savings, return original to preserve PDF structure
		return jpegData
	}
}

// Compress PNG data by removing metadata
func compressPngData(pngData []byte) []byte {
	result := make([]byte, 0, len(pngData))
	i := 8 // Skip PNG signature
	
	// Copy PNG signature
	result = append(result, pngData[:8]...)
	
	for i < len(pngData) {
		if i+8 > len(pngData) {
			// Copy remaining bytes
			result = append(result, pngData[i:]...)
			break
		}
		
		// Read chunk length and type
		chunkLength := int(pngData[i])<<24 + int(pngData[i+1])<<16 + int(pngData[i+2])<<8 + int(pngData[i+3])
		chunkType := string(pngData[i+4:i+8])
		
		// Keep essential chunks and be more conservative
		// Only remove clearly non-essential metadata chunks
		keepChunk := true
		switch chunkType {
		case "tEXt", "zTXt", "iTXt": // Text metadata
			if chunkLength > 1024 { // Only remove large text chunks
				keepChunk = false
				fmt.Printf("[WASM] Removing large PNG text chunk: %s (%d bytes)\n", chunkType, chunkLength)
			}
		case "tIME": // Timestamp
			keepChunk = false
			fmt.Printf("[WASM] Removing PNG timestamp chunk: %s (%d bytes)\n", chunkType, chunkLength)
		case "pHYs": // Physical dimensions - only remove if large
			if chunkLength > 512 {
				keepChunk = false
				fmt.Printf("[WASM] Removing PNG pHYs chunk: %s (%d bytes)\n", chunkType, chunkLength)
			}
		}
		
		if keepChunk {
			// Copy the entire chunk (length + type + data + CRC)
			chunkEnd := i + 12 + chunkLength
			if chunkEnd <= len(pngData) {
				result = append(result, pngData[i:chunkEnd]...)
			}
		}
		
		// Move to next chunk
		i += 12 + chunkLength
	}
	
	return result
}

// Remove metadata from PDF binary data
func removeMetadataBinary(data []byte) []byte {
	fmt.Printf("[WASM] removeMetadataBinary: removing metadata\n")
	
	// Convert to string for pattern matching (safe for text sections)
	content := string(data)
	
	// Remove common metadata patterns
	patterns := []string{
		"/Creator", "/Producer", "/CreationDate", "/ModDate",
		"/Title", "/Author", "/Subject", "/Keywords",
	}
	
	for _, pattern := range patterns {
		for {
			start := strings.Index(content, pattern)
			if start == -1 {
				break
			}
			
			// Find the end of this metadata entry
			end := start + len(pattern)
			
			// Skip to end of the value (look for next / or >>)
			for end < len(content) && content[end] != '/' && !strings.HasPrefix(content[end:], ">>") {
				end++
			}
			
			// Remove this metadata entry
			content = content[:start] + content[end:]
			fmt.Printf("[WASM] Removed metadata: %s\n", pattern)
		}
	}
	
	return []byte(content)
}

// Optimize PDF streams and remove duplicates
func optimizeStreams(data []byte) []byte {
	fmt.Printf("[WASM] optimizeStreams: optimizing PDF streams\n")
	
	// Look for stream objects and try to compress them better
	content := string(data)
	
	// Remove redundant whitespace in streams
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = strings.ReplaceAll(content, "\r", "\n")
	
	// Remove multiple consecutive newlines
	for strings.Contains(content, "\n\n\n") {
		content = strings.ReplaceAll(content, "\n\n\n", "\n\n")
	}
	
	// Remove spaces before newlines
	content = strings.ReplaceAll(content, " \n", "\n")
	content = strings.ReplaceAll(content, "\t\n", "\n")
	
	// Compress multiple spaces
	for strings.Contains(content, "  ") {
		content = strings.ReplaceAll(content, "  ", " ")
	}
	
	return []byte(content)
}

// Aggressive PDF compression - targets PDF object structure
func aggressivePdfCompression(data []byte) []byte {
	fmt.Printf("[WASM] aggressivePdfCompression: trying more aggressive approaches\n")
	
	content := string(data)
	
	// Strategy 1: Remove entire image objects that are very large
	result := removeImageObjects(content)
	fmt.Printf("[WASM] After removing image objects: %d -> %d bytes\n", len(content), len(result))
	
	// Strategy 2: Compress streams more aggressively
	result = compressStreamsAggressively(result)
	fmt.Printf("[WASM] After aggressive stream compression: %d bytes\n", len(result))
	
	// Strategy 3: Remove redundant objects
	result = removeDuplicateObjects(result)
	fmt.Printf("[WASM] After removing duplicates: %d bytes\n", len(result))
	
	return []byte(result)
}

// Remove large image objects from PDF
func removeImageObjects(content string) string {
	fmt.Printf("[WASM] removeImageObjects: scanning for large image objects\n")
	
	// Look for image objects and remove the largest ones
	lines := strings.Split(content, "\n")
	var filtered []string
	inImageObject := false
	objectSize := 0
	currentObject := []string{}
	
	for _, line := range lines {
		// Detect start of object
		if strings.Contains(line, "obj") && (strings.Contains(line, "0 obj") || strings.Contains(line, "1 obj") || strings.Contains(line, "2 obj")) {
			inImageObject = false
			objectSize = 0
			currentObject = []string{}
		}
		
		// Check if this is an image object
		if strings.Contains(line, "/Type /XObject") && strings.Contains(content[strings.Index(content, line):], "/Subtype /Image") {
			inImageObject = true
			fmt.Printf("[WASM] Found image object\n")
		}
		
		if inImageObject {
			currentObject = append(currentObject, line)
			objectSize += len(line)
			
			// If we hit endobj, decide whether to keep this object
			if strings.Contains(line, "endobj") {
				// Remove objects larger than 100KB
				if objectSize > 100000 {
					fmt.Printf("[WASM] Removing large image object: %d bytes\n", objectSize)
					// Replace with minimal placeholder
					filtered = append(filtered, "% Large image object removed for compression")
				} else {
					filtered = append(filtered, currentObject...)
				}
				inImageObject = false
				currentObject = []string{}
				objectSize = 0
			}
		} else {
			filtered = append(filtered, line)
		}
	}
	
	return strings.Join(filtered, "\n")
}

// Compress PDF streams more aggressively
func compressStreamsAggressively(content string) string {
	fmt.Printf("[WASM] compressStreamsAggressively: targeting stream objects\n")
	
	// Remove large streams (especially image streams)
	streamPattern := "stream"
	endStreamPattern := "endstream"
	
	result := content
	for {
		streamStart := strings.Index(result, streamPattern)
		if streamStart == -1 {
			break
		}
		
		streamEnd := strings.Index(result[streamStart:], endStreamPattern)
		if streamEnd == -1 {
			break
		}
		
		streamEnd += streamStart + len(endStreamPattern)
		streamSize := streamEnd - streamStart
		
		// If stream is larger than 50KB, replace with placeholder
		if streamSize > 50000 {
			fmt.Printf("[WASM] Replacing large stream: %d bytes\n", streamSize)
			replacement := "stream\n% Large stream removed for compression\nendstream"
			result = result[:streamStart] + replacement + result[streamEnd:]
		} else {
			// Skip this stream and look for the next one
			result = result[:streamStart] + "PROCESSED" + result[streamStart+len(streamPattern):]
		}
	}
	
	// Restore the PROCESSED markers
	result = strings.ReplaceAll(result, "PROCESSED", streamPattern)
	
	return result
}

// Remove duplicate objects
func removeDuplicateObjects(content string) string {
	fmt.Printf("[WASM] removeDuplicateObjects: removing redundant objects\n")
	
	// Simple approach: remove duplicate /Metadata objects
	metadataCount := strings.Count(content, "/Type /Metadata")
	if metadataCount > 1 {
		fmt.Printf("[WASM] Found %d metadata objects, keeping only first\n", metadataCount)
		
		// Keep only the first metadata object
		first := strings.Index(content, "/Type /Metadata")
		if first != -1 {
			remaining := content[first+len("/Type /Metadata"):]
			for strings.Contains(remaining, "/Type /Metadata") {
				start := strings.Index(remaining, "/Type /Metadata")
				// Find the end of this metadata object
				objEnd := strings.Index(remaining[start:], "endobj")
				if objEnd != -1 {
					objEnd += start + len("endobj")
					remaining = remaining[:start] + remaining[objEnd:]
				} else {
					break
				}
			}
			content = content[:first+len("/Type /Metadata")] + remaining
		}
	}
	
	return content
}

// PDF compression with proper argument handling and logging
func compressPDF(this js.Value, args []js.Value) interface{} {
	// Capture original arguments before creating Promise handler
	fmt.Printf("[WASM] compressPDF called with %d arguments\n", len(args))
	
	if len(args) < 1 {
		return js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			promiseArgs[1].Invoke(js.ValueOf("compressPDF: Missing input data argument"))
			return nil
		}))
	}

	// Capture the original arguments
	inputArray := args[0]
	var progressCallback js.Value
	if len(args) > 1 {
		progressCallback = args[1]
	}

	fmt.Printf("[WASM] Input data type: %s, length: %d\n", inputArray.Type().String(), inputArray.Length())

	handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		go func() {
			defer func() {
				if r := recover(); r != nil {
					errorMsg := fmt.Sprintf("Panic in PDF compression: %v", r)
					fmt.Printf("[WASM ERROR] %s\n", errorMsg)
					reject.Invoke(js.ValueOf(errorMsg))
				}
			}()

			fmt.Printf("[WASM] Starting PDF compression process\n")

			if inputArray.Length() == 0 {
				fmt.Printf("[WASM ERROR] Empty input data\n")
				reject.Invoke(js.ValueOf("Empty input data"))
				return
			}

			fmt.Printf("[WASM] Creating byte slice of size %d\n", inputArray.Length())
			inputBytes := make([]byte, inputArray.Length())
			
			fmt.Printf("[WASM] Copying bytes from JS to Go\n")
			js.CopyBytesToGo(inputBytes, inputArray)
			fmt.Printf("[WASM] Successfully copied %d bytes\n", len(inputBytes))

			reportProgress := func(progress int) {
				if !progressCallback.IsUndefined() && !progressCallback.IsNull() {
					progressCallback.Invoke(js.ValueOf(progress))
				}
			}

			reportProgress(10)

			// Implement basic PDF compression through size reduction
			fmt.Printf("[WASM] Starting PDF processing\n")
			
			// For PDF files, we'll implement a multi-step compression:
			// 1. Remove metadata and unnecessary data
			// 2. Compress streams
			// 3. Remove redundant objects
			
			outputBytes := compressPDFData(inputBytes, reportProgress)
			fmt.Printf("[WASM] PDF compression completed: %d -> %d bytes\n", len(inputBytes), len(outputBytes))

			// Create JS Uint8Array for return
			jsOutput := js.Global().Get("Uint8Array").New(len(outputBytes))
			js.CopyBytesToJS(jsOutput, outputBytes)

			// Return result object
			result := js.Global().Get("Object").New()
			result.Set("data", jsOutput)
			result.Set("originalSize", len(inputBytes))
			result.Set("compressedSize", len(outputBytes))
			result.Set("compressionRatio", float64(len(outputBytes))/float64(len(inputBytes)))

			resolve.Invoke(result)
		}()

		return nil
	})

	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

// Image compression with proper argument handling and logging
func compressImage(this js.Value, args []js.Value) interface{} {
	// Capture original arguments before creating Promise handler
	fmt.Printf("[WASM] compressImage called with %d arguments\n", len(args))
	
	if len(args) < 2 {
		return js.Global().Get("Promise").New(js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
			promiseArgs[1].Invoke(js.ValueOf("compressImage: Missing required arguments (data, mimeType)"))
			return nil
		}))
	}

	// Capture the original arguments
	inputArray := args[0]
	mimeType := args[1].String()
	var progressCallback js.Value
	if len(args) > 2 {
		progressCallback = args[2]
	}

	fmt.Printf("[WASM] Image data type: %s, length: %d, mimeType: %s\n", inputArray.Type().String(), inputArray.Length(), mimeType)

	handler := js.FuncOf(func(this js.Value, promiseArgs []js.Value) interface{} {
		resolve := promiseArgs[0]
		reject := promiseArgs[1]

		go func() {
			defer func() {
				if r := recover(); r != nil {
					errorMsg := fmt.Sprintf("Panic in image compression: %v", r)
					fmt.Printf("[WASM ERROR] %s\n", errorMsg)
					reject.Invoke(js.ValueOf(errorMsg))
				}
			}()

			fmt.Printf("[WASM] Starting image compression process\n")

			fmt.Printf("[WASM] Creating byte slice of size %d\n", inputArray.Length())
			inputBytes := make([]byte, inputArray.Length())
			
			fmt.Printf("[WASM] Copying bytes from JS to Go\n")
			js.CopyBytesToGo(inputBytes, inputArray)
			fmt.Printf("[WASM] Successfully copied %d bytes\n", len(inputBytes))

			reportProgress := func(progress int) {
				if !progressCallback.IsUndefined() && !progressCallback.IsNull() {
					progressCallback.Invoke(js.ValueOf(progress))
				}
			}

			reportProgress(20)

			// Decode image
			var img image.Image
			var err error

			reader := bytes.NewReader(inputBytes)
			
			if strings.Contains(mimeType, "jpeg") || strings.Contains(mimeType, "jpg") {
				img, err = jpeg.Decode(reader)
			} else if strings.Contains(mimeType, "png") {
				img, err = png.Decode(reader)
			} else {
				// Try to decode as generic image
				img, _, err = image.Decode(reader)
			}

			if err != nil {
				reject.Invoke(js.ValueOf(fmt.Sprintf("Failed to decode image: %v", err)))
				return
			}

			reportProgress(40)

			// Get image dimensions
			bounds := img.Bounds()
			width := bounds.Dx()
			height := bounds.Dy()

			// Resize if image is too large
			maxDimension := 2048
			if width > maxDimension || height > maxDimension {
				if width > height {
					height = height * maxDimension / width
					width = maxDimension
				} else {
					width = width * maxDimension / height
					height = maxDimension
				}
				img = imaging.Resize(img, width, height, imaging.Lanczos)
			}

			reportProgress(60)

			// Try different compression methods and choose the best
			var bestResult []byte
			var bestSize int = len(inputBytes)
			fmt.Printf("[WASM] Original image size: %d bytes\n", len(inputBytes))

			// Method 1: High-quality JPEG (85%)
			jpegBuf := new(bytes.Buffer)
			err = jpeg.Encode(jpegBuf, img, &jpeg.Options{Quality: 85})
			if err == nil && jpegBuf.Len() < bestSize {
				bestResult = jpegBuf.Bytes()
				bestSize = jpegBuf.Len()
				fmt.Printf("[WASM] JPEG 85%% quality: %d bytes\n", jpegBuf.Len())
			}

			reportProgress(70)

			// Method 2: Medium-quality JPEG (75%)
			jpegBuf2 := new(bytes.Buffer)
			err = jpeg.Encode(jpegBuf2, img, &jpeg.Options{Quality: 75})
			if err == nil && jpegBuf2.Len() < bestSize {
				bestResult = jpegBuf2.Bytes()
				bestSize = jpegBuf2.Len()
				fmt.Printf("[WASM] JPEG 75%% quality: %d bytes (best so far)\n", jpegBuf2.Len())
			}

			reportProgress(80)

			// Method 3: Lower quality JPEG (60%)
			jpegBuf3 := new(bytes.Buffer)
			err = jpeg.Encode(jpegBuf3, img, &jpeg.Options{Quality: 60})
			if err == nil && jpegBuf3.Len() < bestSize {
				bestResult = jpegBuf3.Bytes()
				bestSize = jpegBuf3.Len()
				fmt.Printf("[WASM] JPEG 60%% quality: %d bytes (best so far)\n", jpegBuf3.Len())
			}

			// Method 4: Aggressive JPEG (40%)
			jpegBuf4 := new(bytes.Buffer)
			err = jpeg.Encode(jpegBuf4, img, &jpeg.Options{Quality: 40})
			if err == nil && jpegBuf4.Len() < bestSize {
				bestResult = jpegBuf4.Bytes()
				bestSize = jpegBuf4.Len()
				fmt.Printf("[WASM] JPEG 40%% quality: %d bytes (best so far)\n", jpegBuf4.Len())
			}

			reportProgress(90)

			// If no significant compression achieved, try PNG
			if float64(bestSize) >= float64(len(inputBytes))*0.8 && !strings.Contains(mimeType, "png") {
				pngBuf := new(bytes.Buffer)
				err = png.Encode(pngBuf, img)
				if err == nil && pngBuf.Len() < bestSize {
					bestResult = pngBuf.Bytes()
					bestSize = pngBuf.Len()
					fmt.Printf("[WASM] PNG fallback: %d bytes (best so far)\n", pngBuf.Len())
				}
			}

			// Only return original if compression is really ineffective
			if float64(bestSize) >= float64(len(inputBytes))*0.95 {
				fmt.Printf("[WASM] Compression not effective, returning original\n")
				bestResult = inputBytes
				bestSize = len(inputBytes)
			} else {
				fmt.Printf("[WASM] Best compression: %d -> %d bytes (%.1f%% reduction)\n", 
					len(inputBytes), bestSize, (1.0-float64(bestSize)/float64(len(inputBytes)))*100)
			}

			// Create result
			jsOutput := js.Global().Get("Uint8Array").New(len(bestResult))
			js.CopyBytesToJS(jsOutput, bestResult)

			result := js.Global().Get("Object").New()
			result.Set("data", jsOutput)
			result.Set("originalSize", len(inputBytes))
			result.Set("compressedSize", len(bestResult))
			result.Set("compressionRatio", float64(len(bestResult))/float64(len(inputBytes)))

			reportProgress(100)
			resolve.Invoke(result)
		}()

		return nil
	})

	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

// Batch compression for multiple files
func compressBatch(this js.Value, args []js.Value) interface{} {
	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		resolve := args[0]
		reject := args[1]

		go func() {
			defer func() {
				if r := recover(); r != nil {
					reject.Invoke(js.ValueOf(fmt.Sprintf("Panic in batch compression: %v", r)))
				}
			}()

			if len(args) < 2 {
				reject.Invoke(js.ValueOf("Missing arguments"))
				return
			}

			filesArray := args[0]
			progressCallback := args[1]

			filesLength := filesArray.Length()
			results := make([]js.Value, filesLength)

			reportProgress := func(progress int) {
				if !progressCallback.IsUndefined() && !progressCallback.IsNull() {
					progressCallback.Invoke(js.ValueOf(progress))
				}
			}

			for i := 0; i < filesLength; i++ {
				fileObj := filesArray.Index(i)
				fileData := fileObj.Get("data")
				fileType := fileObj.Get("type").String()

				inputBytes := make([]byte, fileData.Length())
				js.CopyBytesToGo(inputBytes, fileData)

				var outputBytes []byte

				// Progress for individual file
				fileProgress := func(p int) {
					overallProgress := (i*100 + p) / filesLength
					reportProgress(overallProgress)
				}

				if strings.Contains(fileType, "pdf") {
					// For PDF, return original for now
					outputBytes = inputBytes
				} else if strings.Contains(fileType, "image") {
					// Use image compression logic (simplified for batch)
					reader := bytes.NewReader(inputBytes)
					img, _, decodeErr := image.Decode(reader)
					if decodeErr == nil {
						jpegBuf := new(bytes.Buffer)
						jpegErr := jpeg.Encode(jpegBuf, img, &jpeg.Options{Quality: 80})
						if jpegErr == nil {
							outputBytes = jpegBuf.Bytes()
						} else {
							outputBytes = inputBytes
						}
					} else {
						outputBytes = inputBytes
					}
				} else {
					outputBytes = inputBytes
				}

				fileProgress(100)

				// Create result for this file
				jsOutput := js.Global().Get("Uint8Array").New(len(outputBytes))
				js.CopyBytesToJS(jsOutput, outputBytes)

				result := js.Global().Get("Object").New()
				result.Set("data", jsOutput)
				result.Set("originalSize", len(inputBytes))
				result.Set("compressedSize", len(outputBytes))
				result.Set("compressionRatio", float64(len(outputBytes))/float64(len(inputBytes)))

				results[i] = result
			}

			// Convert results to JS array
			jsResults := js.Global().Get("Array").New(len(results))
			for i, result := range results {
				jsResults.SetIndex(i, result)
			}

			reportProgress(100)
			resolve.Invoke(jsResults)
		}()

		return nil
	})

	promiseConstructor := js.Global().Get("Promise")
	return promiseConstructor.New(handler)
}

func main() {
	c := make(chan struct{}, 0)

	// Register global functions
	js.Global().Set("compressPDF", js.FuncOf(compressPDF))
	js.Global().Set("compressImage", js.FuncOf(compressImage))
	js.Global().Set("compressBatch", js.FuncOf(compressBatch))

	// Signal that WASM is ready
	js.Global().Set("wasmReady", js.ValueOf(true))

	<-c // Keep the main goroutine alive
} 