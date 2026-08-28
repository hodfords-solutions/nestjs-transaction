import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver.js';
import { DriverUtils } from 'typeorm/driver/DriverUtils.js';
import { ObjectUtils } from 'typeorm/util/ObjectUtils.js';
import { CustomMongoQueryRunner } from './mongo-query-runner.js';

export class CustomMongoDriver extends MongoDriver {
    /**
     * Performs connection to the database.
     */
    async connect(): Promise<void> {
        const options = DriverUtils.buildMongoDBDriverOptions(this.options);

        const client = await this.mongodb.MongoClient.connect(
            this.buildConnectionUrl(options),
            this.buildConnectionOptions(options)
        );

        this.queryRunner = new CustomMongoQueryRunner(this.dataSource, client) as any;
        ObjectUtils.assign(this.queryRunner, {
            manager: this.dataSource.manager
        });
    }
}
