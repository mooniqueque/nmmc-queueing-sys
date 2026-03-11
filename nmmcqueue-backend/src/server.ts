import 'dotenv/config';
import { app } from './app.js';

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
