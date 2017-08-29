var webpack = require("webpack");
var path = require("path");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var src = path.join(__dirname, "src");
var pluginName = "ng-scrollbar";

module.exports = {
    entry: {
        [pluginName]: path.join(src, pluginName + ".js"),
    },
    output: {
        filename: "[name].min.js",
        path: path.join(__dirname, "dist"),
        publicPath: "",
    },
    resolve: {
        extensions: [".js", ".scss"],
    },
    module: {
        rules: [
            {
                test: /\.(css|scss)$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        { loader: 'css-loader' },
                        {
                            loader: 'postcss-loader',
                            options: {
                                autoprefixer: true,
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: [
                                    src
                                ]
                            }
                        }
                    ]
                })
            }]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: pluginName + ".css",
        }),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false }
        })
    ]
}