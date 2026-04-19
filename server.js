const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = require('http').createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            const { pathname } = parsedUrl;

            // Serve static assets from /_next/static/ or /admin/_next/static/
            const staticPrefix = '/admin/_next/static/';
            const altStaticPrefix = '/_next/static/';
            let staticPath = null;

            if (pathname.startsWith(staticPrefix)) {
                staticPath = pathname.replace(staticPrefix, '');
            } else if (pathname.startsWith(altStaticPrefix)) {
                staticPath = pathname.replace(altStaticPrefix, '');
            }

            if (staticPath) {
                const filePath = path.join(__dirname, '.next', 'static', staticPath);
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(filePath);
                    let contentType = 'text/plain';
                    if (ext === '.js') contentType = 'application/javascript';
                    else if (ext === '.css') contentType = 'text/css';
                    else if (ext === '.woff2') contentType = 'font/woff2';
                    else if (ext === '.woff') contentType = 'font/woff';
                    else if (ext === '.ttf') contentType = 'font/ttf';
                    else if (ext === '.svg') contentType = 'image/svg+xml';
                    else if (ext === '.png') contentType = 'image/png';
                    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                    else if (ext === '.json') contentType = 'application/json';

                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    fs.createReadStream(filePath).pipe(res);
                    return;
                }
            }

            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    });

    server.listen(port, () => {
        console.log(`> ShelfCure Admin ready on http://${hostname}:${port}/admin`);
    });
});
