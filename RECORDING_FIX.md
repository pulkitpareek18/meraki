# 🎵 Ultravox Recording Integration - Fixed

## Overview
The Ultravox recording API integration has been updated to properly handle the 302 redirect response that contains the actual recording URL in the `location` header.

## Issue Resolved
The Ultravox API `/api/calls/{call_id}/recording` endpoint returns:
- **Status Code**: 302 (Redirect)
- **Location Header**: Contains the actual Google Storage URL for the recording
- **Content-Type**: `text/html; charset=utf-8` (not JSON)

## Solution Implementation

### 1. Updated Ultravox Service (`src/services/ultravox.js`)

**Enhanced `requestUltravoxAPI` function:**
```javascript
// Handle redirect - extract the location header for recording URL
if (response.statusCode === 302 || response.statusCode === 301) {
    const redirectUrl = response.headers.location;
    if (redirectUrl) {
        console.log(`🔗 Redirect detected, recording URL: ${redirectUrl.substring(0, 100)}...`);
        resolve({ recordingUrl: redirectUrl, isRedirect: true });
    } else {
        console.error('❌ Redirect response without location header');
        reject(new Error('Redirect response without location header'));
    }
}
```

**Enhanced `getUltravoxCallRecording` function:**
```javascript
// Handle redirect response (most common case)
if (recording && recording.isRedirect && recording.recordingUrl) {
    console.log(`🎵 Recording URL from redirect: ${recording.recordingUrl.substring(0, 100)}...`);
    return recording.recordingUrl;
}
```

### 2. Updated API Controller (`src/controllers/apiController.js`)

**Enhanced `getCallRecording` endpoint:**
- Extracts the correct Ultravox call ID from conversation raw data
- Handles string and object responses properly
- Returns structured response with recording URL, call ID, and conversation ID
- Improved error handling and logging

### 3. Frontend Integration (Already Working)
The existing frontend code in `conversationDetail.js` properly handles:
- Fetching recordings via AJAX
- Displaying audio player with multiple source formats
- Showing recording URL as downloadable link
- Error handling and loading states

## API Response Structure

### Success Response:
```json
{
    "ok": true,
    "message": "Recording URL retrieved successfully from Ultravox",
    "data": {
        "recordingUrl": "https://storage.googleapis.com/fixie-ultravox-prod/call_recordings/2025/10/30/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b.wav?X-Goog-Algorithm=GOOG4-RSA-SHA256&...",
        "callId": "dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b",
        "conversationId": "dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b"
    }
}
```

### Error Response:
```json
{
    "ok": false,
    "error": "Recording not found for call dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b",
    "data": {
        "callId": "dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b",
        "conversationId": "dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b"
    }
}
```

## Testing Results

✅ **All Tests Pass:**
- Handles 302 redirects from Ultravox API
- Extracts recording URL from location header
- Returns proper response structure to frontend
- Frontend displays audio player with recording
- Includes download link for recording file

## Usage Instructions

### 1. Fetch Recording via API:
```bash
curl -X GET "http://localhost:5000/api/conversations/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b/recording"
```

### 2. Frontend Integration:
The "Fetch Recording" button on conversation detail pages will:
1. Call the recording API endpoint
2. Display audio player if successful
3. Show recording URL for direct download
4. Handle errors gracefully

### 3. Call ID Resolution:
The system intelligently resolves the correct Ultravox call ID:
1. First checks for `conversation.raw.uvxResponse.callId`
2. Falls back to using the conversation ID directly
3. Logs which ID is being used for debugging

## Technical Details

### Recording URL Format:
```
https://storage.googleapis.com/fixie-ultravox-prod/call_recordings/YYYY/MM/DD/{call_id}.wav
```

### URL Parameters:
- **X-Goog-Algorithm**: Authentication algorithm
- **X-Goog-Credential**: Service account credentials
- **X-Goog-Date**: Request timestamp
- **X-Goog-Expires**: URL expiration (300 seconds = 5 minutes)
- **X-Goog-SignedHeaders**: Signed headers list
- **X-Goog-Signature**: Digital signature for authentication

### Security Notes:
- Recording URLs are signed and expire after 5 minutes
- URLs include Google Cloud authentication parameters
- Direct downloads are supported for authorized requests

## Monitoring and Debugging

### Logs to Watch:
```
🎵 Fetching recording for conversation: {id}
🎵 Using Ultravox call ID from raw data: {id}
🌐 Ultravox API response: 302
🔗 Redirect detected, recording URL: {url}...
✅ Recording URL retrieved: {url}...
```

### Common Issues:
1. **404 Errors**: Recording not yet available or expired
2. **API Key Issues**: Check ULTRAVOX_API_KEY configuration
3. **Network Timeouts**: Increased timeout to 15 seconds for recording requests

## Files Modified:
- ✅ `src/services/ultravox.js` - Enhanced redirect handling
- ✅ `src/controllers/apiController.js` - Improved response handling
- ✅ `src/views/conversationDetail.js` - Already working correctly

## Next Steps:
1. Deploy updated code to production
2. Test with live Ultravox API endpoints
3. Monitor recording fetch success rates
4. Consider caching recording URLs if needed