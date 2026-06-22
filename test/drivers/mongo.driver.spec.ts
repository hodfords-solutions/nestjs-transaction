import 'reflect-metadata';
import { DriverUtils } from 'typeorm/driver/DriverUtils';
import { CustomMongoDriver } from '../../lib/drivers/mongo.driver';
import { CustomMongoQueryRunner } from '../../lib/drivers/mongo-query-runner';

describe('CustomMongoDriver', () => {
    it('connects with a CustomMongoQueryRunner and binds the connection manager', async () => {
        const client = { kind: 'mongo-client' };
        const manager = { kind: 'manager' };

        jest.spyOn(DriverUtils, 'buildMongoDBDriverOptions').mockReturnValue({} as any);

        const driver = Object.create(CustomMongoDriver.prototype) as any;
        driver.options = {};
        driver.connection = { manager };
        driver.mongodb = {
            MongoClient: { connect: jest.fn().mockResolvedValue(client) }
        };
        driver.buildConnectionUrl = jest.fn().mockReturnValue('mongodb://localhost');
        driver.buildConnectionOptions = jest.fn().mockReturnValue({ useUnifiedTopology: true });

        await driver.connect();

        expect(driver.mongodb.MongoClient.connect).toHaveBeenCalledWith('mongodb://localhost', {
            useUnifiedTopology: true
        });
        expect(driver.queryRunner).toBeInstanceOf(CustomMongoQueryRunner);
        expect(driver.queryRunner.manager).toBe(manager);

        (DriverUtils.buildMongoDBDriverOptions as jest.Mock).mockRestore();
    });
});
