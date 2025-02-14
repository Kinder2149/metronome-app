const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

// Récupérer le nom du repository
const repoName = 'metronome-app';

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
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
        path: path.resolve(__dirname, 'dist'),
        publicPath: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
        clean: true
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: 'src/manifest.json',
                    to: '',
                    transform(content) {
                        const manifest = JSON.parse(content);
                        manifest.start_url = process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/';
                        manifest.scope = process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/';
                        return JSON.stringify(manifest, null, 2);
                    }
                },
                { 
                    from: 'src/icons',
                    to: 'icons',
                    noErrorOnMissing: true
                },
                { 
                    from: 'public/sounds',
                    to: 'sounds',
                    noErrorOnMissing: true
                }
            ]
        }),
        new WorkboxPlugin.GenerateSW({
            clientsClaim: true,
            skipWaiting: true,
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
            runtimeCaching: [{
                urlPattern: new RegExp('\\.(?:png|jpg|jpeg|svg|wav)$'),
                handler: 'CacheFirst'
            }]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        host: '0.0.0.0',
        port: 8080,
        hot: true,
        historyApiFallback: true,
        https: true
    }
};