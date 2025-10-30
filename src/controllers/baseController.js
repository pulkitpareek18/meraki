/**
 * Base controller with common functionality and error handling
 */

/**
 * Standard response wrapper for consistent API responses
 */
export function sendResponse(res, statusCode = 200, data = {}, message = null) {
    const response = {
        ok: statusCode < 400,
        timestamp: new Date().toISOString(),
        ...data
    };
    
    if (message) {
        response.message = message;
    }
    
    return res.status(statusCode).json(response);
}

/**
 * Standard error response wrapper
 */
export function sendError(res, statusCode = 500, error = 'Internal server error', details = null) {
    const response = {
        ok: false,
        error,
        timestamp: new Date().toISOString()
    };
    
    if (details) {
        response.details = details;
    }
    
    console.error(`API Error [${statusCode}]:`, error, details || '');
    return res.status(statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors automatically
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Validation helper for request parameters
 */
export function validateRequired(obj, requiredFields) {
    const missing = requiredFields.filter(field => !obj[field]);
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceLogging(controllerName) {
    return function(target, propertyName, descriptor) {
        const method = descriptor.value;
        
        descriptor.value = async function(...args) {
            const startTime = Date.now();
            const [req] = args;
            
            console.log(`🚀 [${controllerName}] ${propertyName} started - ${req.method} ${req.path}`);
            
            try {
                const result = await method.apply(this, args);
                const duration = Date.now() - startTime;
                console.log(`✅ [${controllerName}] ${propertyName} completed in ${duration}ms`);
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                console.error(`❌ [${controllerName}] ${propertyName} failed after ${duration}ms:`, error.message);
                throw error;
            }
        };
        
        return descriptor;
    };
}