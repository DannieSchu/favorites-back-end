// require json web token
const jwt = require('./jwt');

module.exports = function checkAuth(req, res, next) {
    const token = req.get('Authorization');
    // confirm that there is a token
    if (!token) {
        res.status(401).json({ error: 'no authorization found' });
        return;
    }

    let payload = null;
    // verify that token is valid
    try {
        payload = jwt.verify(token);
    }
    catch (err) {
        // this code runs if verification fails
        res.status(401).json({ error: 'invalid token' });
        return;
    }
    // if makes it through first two checks, every userId request will have a userId on it
    req.userId = payload.id;
    // pushes you to next
    next();
};