// Standardized API responses
export const success = (data, message = 'Success', statusCode = 200) => ({
    success: true,
    message,
    data,
    statusCode
});

export const error = (message, statusCode = 500, details = null) => ({
    success: false,
    message,
    error: details,
    statusCode
});

export const sendResponse = (res, response) => {
    return res.status(response.statusCode).json(response);
};