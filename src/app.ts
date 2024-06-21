import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import router from './route/tasks';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send({ error: 'Something went wrong!' });
});

app.get('/', (req: Request, res: Response) => {
    res.send('Server is running');
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
