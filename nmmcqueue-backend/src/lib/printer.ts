import { spawn } from 'child_process';
import path from 'path';
import logger from './logger.js';

export function printTicket(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
        const pyScript = path.join(process.cwd(), 'src', 'lib', 'print.py');
        const payload = {
            ...data,
            logo_path: path.join(process.cwd(), '../nmmcqueue-frontend/public/nmmc-logo.png'),
            doh_logo_path: path.join(process.cwd(), '../nmmcqueue-frontend/public/doh-logo.png')
        };
        const py = spawn('python', [pyScript, JSON.stringify(payload)]);

        let output = '';
        let errorOutput = '';

        py.stdout.on('data', (d) => {
            output += d.toString();
        });

        py.stderr.on('data', (d) => {
            errorOutput += d.toString();
        });

        py.on('close', (code) => {
            if (code === 0) {
                logger.info(`Print success: ${output.trim()}`);
                resolve();
            } else {
                logger.error(`Print failed with code ${code}: ${errorOutput.trim()}`);
                reject(new Error(errorOutput || 'Print failed'));
            }
        });
        
        py.on('error', (err) => {
            logger.error(`Failed to start python process: ${err.message}`);
            reject(err);
        });
    });
}
