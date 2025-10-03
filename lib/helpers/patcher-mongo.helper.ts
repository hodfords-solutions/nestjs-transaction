import { DriverFactory } from 'typeorm/driver/DriverFactory';
import { CustomMongoDriver } from '../drivers/mongo.driver';
import { DataSource } from 'typeorm';

const rawDriverCreate = DriverFactory.prototype.create;
DriverFactory.prototype.create = function (connection: DataSource) {
    if (connection.options.type === 'mongodb') {
        return new CustomMongoDriver(connection);
    }
    return rawDriverCreate.apply(this, [connection]);
};
