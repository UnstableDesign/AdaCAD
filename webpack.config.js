const path = require('path');

module.exports = {
    mode: 'development', // or 'production',
    entry: './src/index.ts',
    resolve: {
        // configuration options
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.mdx'],

    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },

    module: {
        rules: [
            //typescript specific rules
            {
                test: /\.(ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader', // Use ts-loader to integrate with tsc
                        options: {
                            compilerOptions: {
                                // Override specific tsconfig options for webpack if needed
                                declaration: false, // Don't generate declaration files in webpack build
                            },
                        },
                    },
                ],
            },
            // …
            {
                test: /\.mdx?$/,
                use: [
                    {
                        loader: '@mdx-js/loader',
                    }
                ]
            }
        ]
    }
}

