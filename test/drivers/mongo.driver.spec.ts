import 'reflect-metadata';
import { describe, it, expect, vi, Mock } from 'vitest';
import { DriverUtils } from 'typeorm/driver/DriverUtils';
import { CustomMongoDriver } from '../../lib/drivers/mongo.driver.js';
import { CustomMongoQueryRunner } from '../../lib/drivers/mongo-query-runner.js';

describe('CustomMongoDriver', () => {
    it('connects with a CustomMongoQueryRunner and binds the connection manager', async () => {
        const client = { kind: 'mongo-client' };
        const manager = { kind: 'manager' };

        vi.spyOn(DriverUtils, 'buildMongoDBDriverOptions').mockReturnValue({} as any);

        const driver = Object.create(CustomMongoDriver.prototype) as any;
        driver.options = {};
        driver.dataSource = { manager };
        driver.mongodb = {
            MongoClient: { connect: vi.fn().mockResolvedValue(client) }
        };
        driver.buildConnectionUrl = vi.fn().mockReturnValue('mongodb://localhost');
        driver.buildConnectionOptions = vi.fn().mockReturnValue({ useUnifiedTopology: true });

        await driver.connect();

        expect(driver.mongodb.MongoClient.connect).toHaveBeenCalledWith('mongodb://localhost', {
            useUnifiedTopology: true
        });
        expect(driver.queryRunner).toBeInstanceOf(CustomMongoQueryRunner);
        expect(driver.queryRunner.manager).toBe(manager);

        (DriverUtils.buildMongoDBDriverOptions as Mock).mockRestore();
    });
});
