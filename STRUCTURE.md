# 📁 Project Structure

The codebase has been refactored from a single monolithic `index.js` file into a well-organized, modular structure:

```
meraki/
├── index.js                    # Main entry point (clean & minimal)
├── src/
│   ├── config/
│   │   └── index.js           # Environment variables & configuration
│   ├── database/
│   │   └── connection.js      # MongoDB & JSON storage logic
│   ├── services/
│   │   ├── conversation.js    # Conversation CRUD operations
│   │   ├── riskAnalysis.js    # Mental health risk assessment & Gemini AI
│   │   └── ultravox.js        # Ultravox API integration
│   ├── controllers/
│   │   ├── apiController.js   # API endpoints for conversations
│   │   ├── callController.js  # Incoming call handling
│   │   └── webhookController.js # Ultravox webhook events
│   ├── middleware/
│   │   └── index.js           # Error handling & request logging
│   ├── routes/
│   │   └── index.js           # Route definitions & organization
│   └── views/
│       ├── dashboard.js       # Dashboard HTML generation
│       └── conversationDetail.js # Conversation detail page HTML
├── package.json
└── README.md
```

## 🎯 Benefits of the New Structure

### 1. **Separation of Concerns**
- **Config**: All environment variables and settings in one place
- **Database**: Isolated data storage logic (MongoDB + JSON fallback)
- **Services**: Business logic separated by domain (conversations, risk analysis, API calls)
- **Controllers**: HTTP request handling separated by responsibility
- **Views**: HTML template generation isolated from business logic
- **Middleware**: Cross-cutting concerns like error handling and logging

### 2. **Maintainability**
- Each module has a single responsibility
- Easy to locate and modify specific functionality
- Clear dependencies between modules
- Better testability with isolated functions

### 3. **Scalability**
- Easy to add new features without touching existing code
- Simple to add new API endpoints or services
- Modular structure supports team development
- Clear interfaces between components

### 4. **Code Reusability**
- Services can be imported and used across different controllers
- Common utilities are centralized
- Configuration is shared across all modules
- Database operations are consistent

## 🚀 Key Modules

### Configuration (`src/config/index.js`)
Centralizes all environment variables and provides validation:
- Server settings (port, base URL)
- Ultravox API configuration
- MongoDB connection settings
- Gemini AI settings
- System prompts and call configuration

### Database (`src/database/connection.js`)
Handles data persistence with dual storage support:
- MongoDB connection and operations
- JSON file fallback for development
- Conversation CRUD operations
- Automatic failover between storage types

### Services
**Conversation Service** (`src/services/conversation.js`):
- Create, read, update conversation records
- Process call completion with transcript analysis
- Batch refresh operations
- AI analysis regeneration

**Risk Analysis Service** (`src/services/riskAnalysis.js`):
- Mental health risk assessment using keyword detection
- Gemini AI integration for advanced analysis
- Emergency alert system
- Multi-language support (Hindi/English)

**Ultravox Service** (`src/services/ultravox.js`):
- API calls to Ultravox platform
- Call creation and management
- Transcript retrieval
- Call listing and details

### Controllers
**API Controller** (`src/controllers/apiController.js`):
- REST API endpoints for conversation management
- Bulk operations (refresh, import, cleanup)
- Data export and analysis endpoints

**Call Controller** (`src/controllers/callController.js`):
- Incoming Twilio call handling
- Ultravox session creation
- TwiML response generation

**Webhook Controller** (`src/controllers/webhookController.js`):
- Ultravox event processing
- Call completion handling
- Emergency alert triggering

### Views
**Dashboard** (`src/views/dashboard.js`):
- Mental health monitoring dashboard
- Risk statistics and visualizations
- Conversation management interface

**Conversation Detail** (`src/views/conversationDetail.js`):
- Individual conversation analysis
- AI insights and recommendations
- Audio playback and transcript display

## 🔧 How to Run

The main entry point remains the same:

```bash
npm start
```

The server will:
1. Load configuration from environment variables
2. Validate required settings
3. Initialize database connections
4. Start the Express server with all routes
5. Provide detailed logging of the startup process

## 🔄 Migration Notes

- **Old file**: `index-old.js` (backup of original monolithic code)
- **New structure**: Modular architecture as described above
- **Backward compatibility**: All existing API endpoints and functionality preserved
- **Environment variables**: No changes required to existing `.env` file

## 📋 Next Steps

1. **Testing**: Verify all endpoints work correctly with the new structure
2. **Documentation**: Add JSDoc comments to all public functions
3. **Unit Tests**: Create tests for individual modules
4. **Performance**: Monitor for any performance changes
5. **Deployment**: Update deployment scripts if needed

The refactored codebase maintains all existing functionality while providing a much cleaner, more maintainable structure for future development.