# 🎵 Call Recording Integration with Ultravox API

## Overview

The enhanced conversation detail page now includes direct integration with the Ultravox API to fetch call recordings. This feature extracts the correct call ID from the conversation data and retrieves recordings directly from Ultravox.

## How It Works

### 1. **Call ID Extraction**
The system intelligently determines which call ID to use:
- **Primary**: Uses `callId` from `raw.uvxResponse.callId` if available
- **Fallback**: Uses the conversation ID if no Ultravox call ID is found

### 2. **API Integration**
- **Endpoint**: `GET /api/conversations/{conversation_id}/recording`
- **Ultravox API**: `GET https://api.ultravox.ai/api/calls/{call_id}/recording`
- **Authentication**: Uses `X-API-Key` header with your Ultravox API key

### 3. **Frontend Feature**
- **Fetch Button**: "🔄 Fetch from Ultravox" button in the recording section
- **Dynamic Loading**: Shows loading state while fetching
- **Smart Display**: Automatically displays audio player when recording URL is obtained
- **Error Handling**: Clear error messages for missing recordings or API issues

## Usage

### For Developers

**API Endpoint:**
```bash
curl -X GET "https://your-app.com/api/conversations/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b/recording" \
  -H "Content-Type: application/json"
```

**Response Format:**
```json
{
  "ok": true,
  "recordingUrl": "https://ultravox-recordings.s3.amazonaws.com/...",
  "message": "Recording URL retrieved successfully from Ultravox",
  "timestamp": "2025-10-30T..."
}
```

### For Users

1. **Open Conversation Detail**: Navigate to `/conversations/{conversation_id}`
2. **Find Recording Section**: Scroll to "🎵 Call Recording" section
3. **Fetch Recording**: Click "🔄 Fetch from Ultravox" button
4. **Play Audio**: Use the built-in audio player when recording loads

## Technical Details

### Call ID Resolution
```javascript
// Priority order for call ID:
1. conversation.raw.uvxResponse.callId  // Ultravox-specific ID
2. conversation.id                      // Fallback to conversation ID
```

### Error Handling
- **404 Not Found**: Recording doesn't exist in Ultravox
- **Authentication**: Invalid or missing API key
- **Network Issues**: Timeout or connection problems
- **Invalid Response**: Malformed API response

### Response Types
The Ultravox API may return different response formats:
- **Direct URL**: `"https://recordings.ultravox.ai/..."`
- **JSON Object**: `{ "url": "https://...", "format": "mp3" }`
- **Binary Data**: Direct audio file (handled automatically)

## Configuration

### Environment Variables
```bash
ULTRAVOX_API_KEY=your_api_key_here
ULTRAVOX_BASE_URL=https://api.ultravox.ai/api
```

### Raw Data Structure
The system looks for call IDs in this structure:
```json
{
  "raw": {
    "uvxResponse": {
      "callId": "dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b",
      "created": "2025-10-30T16:29:40.779573Z",
      "joined": null,
      "ended": null
    }
  }
}
```

## Benefits

✅ **Direct Integration**: No manual URL copying required  
✅ **Smart ID Detection**: Automatically uses correct call ID  
✅ **Real-time Fetching**: Get latest recording status from Ultravox  
✅ **Error Recovery**: Clear feedback when recordings aren't available  
✅ **Debugging Info**: Shows which call ID is being used  

## Troubleshooting

### Common Issues

**"Recording not found"**
- The call may not have a recording yet
- Check if the call was completed successfully
- Verify the call ID matches between systems

**"API Authentication Error"**
- Verify `ULTRAVOX_API_KEY` environment variable
- Check API key permissions in Ultravox dashboard

**"Timeout Error"**
- Network connectivity issues
- Ultravox API may be experiencing delays

### Debug Information

The conversation detail page shows:
- **Stored Call ID**: The conversation ID in your system
- **Ultravox Call ID**: The call ID from raw data (if different)
- **API Response**: Full response data for troubleshooting

## Example Usage

For the conversation `dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b`:

1. **URL**: `https://meraki-iibi.onrender.com/conversations/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b`
2. **API Call**: `GET /api/conversations/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b/recording`
3. **Ultravox API**: `GET https://api.ultravox.ai/api/calls/dcb3a954-d1b0-4e03-a3d6-80e4c0912a6b/recording`

The system will automatically handle the authentication and provide a user-friendly interface for accessing the recording.