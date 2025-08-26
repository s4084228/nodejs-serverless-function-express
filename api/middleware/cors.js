export const setCors = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

export const handleOptions = (req, res) => {
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
};