import 'reflect-metadata';
import { DriverFactory } from 'typeorm/driver/DriverFactory';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver';
// Importing the helper patches DriverFactory.prototype.create as a side effect.
import '../../lib/helpers/patcher-mongo.helper';
import { CustomMongoDriver } from '../../lib/drivers/mongo.driver';

describe('patcher-mongo.helper', () => {
    it('creates a CustomMongoDriver for mongodb connections', () => {
        const factory = new DriverFactory();
        const connection = { options: { type: 'mongodb', url: 'mongodb://localhost:27017/test' } };

        const driver = factory.create(connection as any);

        expect(driver).toBeInstanceOf(CustomMongoDriver);
    });

    it('falls back to the default driver for non-mongodb connections', () => {
        const factory = new DriverFactory();
        const connection = {
            options: { type: 'postgres', host: 'localhost', username: 'u', password: 'p', database: 'd' }
        };

        const driver = factory.create(connection as any);

        expect(driver).toBeInstanceOf(PostgresDriver);
        expect(driver).not.toBeInstanceOf(CustomMongoDriver);
    });
});
