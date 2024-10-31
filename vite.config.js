import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig( {
    plugins: [ react() ],
    resolve: {
        alias: {

            '@': resolve( __dirname, './src' ),
            '@components': resolve( __dirname, './src/components' ),
            '@layout': resolve( __dirname, './src/layout' ),
            '@routes': resolve( __dirname, './src/router' ),
            '@pages': resolve( __dirname, './src/pages' ),
            '@utils': resolve( __dirname, './src/utils' ),
            '@store': resolve( __dirname, './src/store' ),
        }
    },
    base: './',
    server: {
        port: 5173,
    }
} );
