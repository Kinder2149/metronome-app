const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(wav|mp3)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'sounds/[name][ext]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        setupMiddlewares: (middlewares, devServer) => {
            devServer.app.post('/save-file', (req, res) => {
                const uploadDir = path.join(__dirname, 'public', 'sounds');
                
                // Création du dossier s'il n'existe pas
                if (!fs.existsSync(uploadDir)){
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                // Gestion de l'upload
                const busboy = require('busboy');
                const bb = busboy({ headers: req.headers });

                bb.on('file', (name, file, info) => {
                    const saveTo = path.join(uploadDir, info.filename);
                    file.pipe(fs.createWriteStream(saveTo));
                });

                bb.on('close', () => {
                    res.writeHead(200, { 'Connection': 'close' });
                    res.end("Fichier sauvegardé");
                });

                req.pipe(bb);
            });

            return middlewares;
        }
    }
};