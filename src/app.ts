import express from 'express';
import expressWinston from 'express-winston';
import { loggerOptions } from './util';
const app = express();
import pj from '../package.json';
import { runMigration } from './util/migration-manager';
import managementRouter from './router/management.router';
import { adminAuthentication } from './middleware/admin-auth';
import managementController from './controller/management.controller';
import { orgAuthentication } from './middleware/visor-auth';
import usersRouter from './router/users.router';
import visorRouter from './router/visor.router';

app.use(expressWinston.logger(loggerOptions));

runMigration();


/** Parse the body of the request */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* Rules */ 
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});

app.use('/api', adminAuthentication, managementRouter);

app.use('/users', orgAuthentication, usersRouter);

app.use('/visor', orgAuthentication, visorRouter);

app.post('/activate-org', managementController.activateOrgReq);

app.get('/', (req, res) => {
    res.send(`<h1>FISOR Backend v${pj.version}</h1>
    <h2>${pj.description}</h2>`);
});

export default app;
