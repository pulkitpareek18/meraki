import twilio from 'twilio';

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err);
    
    if (req.accepts('xml')) {
        // If it's a Twilio webhook, send valid TwiML
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('An error occurred. Please try again.');
        twiml.hangup();
        res.type('text/xml').send(twiml.toString());
    } else {
        res.status(500).json({ ok: false, error: 'Internal server error' });
    }
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req, res) {
    res.status(404).json({ ok: false, error: 'Route not found' });
}

/**
 * Request logging middleware
 */
export function requestLogger(req, res, next) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
}