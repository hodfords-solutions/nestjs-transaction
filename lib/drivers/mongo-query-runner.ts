import { MongoQueryRunner } from 'typeorm/driver/mongodb/MongoQueryRunner';
import {
    AggregateOptions,
    AggregationCursor,
    AnyBulkWriteOperation,
    BulkWriteOptions,
    CommandOperationOptions,
    CountDocumentsOptions,
    CountOptions,
    DeleteOptions,
    Filter,
    FindCursor,
    FindOneAndDeleteOptions,
    FindOneAndReplaceOptions,
    FindOneAndUpdateOptions,
    UpdateFilter,
    Document,
    OptionalId,
    InsertManyResult,
    InsertOneOptions,
    InsertOneResult,
    ReplaceOptions,
    UpdateResult,
    CollStatsOptions,
    CollStats,
    ChangeStreamOptions,
    ChangeStream,
    UpdateOptions,
    UnorderedBulkOperation,
    OrderedBulkOperation,
    ReadPreference
} from 'typeorm';
import { getCurrentTransactionSession, isInTransaction } from '../helpers/cls-db-transaction.helper';
import { getCustomReplicationMode } from '../helpers/cls-db-replication.helper';

export class CustomMongoQueryRunner extends MongoQueryRunner {
    getOptions<T>(options?: T): T {
        if (!options) {
            options = {} as T;
        }

        if (isInTransaction()) {
            return { ...options, session: getCurrentTransactionSession() };
        }

        const customMode = getCustomReplicationMode();
        if (customMode) {
            return {
                ...options,
                readPreference:
                    customMode === 'master' ? ReadPreference.PRIMARY_PREFERRED : ReadPreference.SECONDARY_PREFERRED
            } as T;
        }

        return options;
    }

    cursor(collectionName: string, filter: Filter<Document>): FindCursor<any> {
        return this.getCollection(collectionName).find(filter || {}, this.getOptions());
    }

    aggregate(collectionName: string, pipeline: Document[], options?: AggregateOptions): AggregationCursor<any> {
        options = this.getOptions(options);
        return super.aggregate(collectionName, pipeline, options);
    }

    async bulkWrite(
        collectionName: string,
        operations: AnyBulkWriteOperation<Document>[],
        options?: BulkWriteOptions
    ): Promise<any> {
        options = this.getOptions(options);
        return super.aggregate(collectionName, operations, options);
    }

    async count(collectionName: string, filter: Filter<Document>, options?: CountOptions): Promise<number> {
        options = this.getOptions(options);
        return super.count(collectionName, filter, options);
    }

    async countDocuments(
        collectionName: string,
        filter: Filter<Document>,
        options?: CountDocumentsOptions
    ): Promise<any> {
        options = this.getOptions(options);
        return super.countDocuments(collectionName, filter, options);
    }

    async deleteOne(collectionName: string, filter: Filter<Document>, options?: DeleteOptions): Promise<any> {
        options = this.getOptions(options);
        return super.deleteOne(collectionName, filter, options);
    }

    async deleteMany(collectionName: string, filter: Filter<Document>, options?: DeleteOptions): Promise<any> {
        options = this.getOptions(options);
        return super.deleteMany(collectionName, filter, options);
    }

    async distinct(
        collectionName: string,
        key: any,
        filter: Filter<Document>,
        options?: CommandOperationOptions
    ): Promise<any> {
        options = this.getOptions(options);
        return super.distinct(collectionName, key, filter, options);
    }

    async findOneAndDelete(
        collectionName: string,
        filter: Filter<Document>,
        options?: FindOneAndDeleteOptions
    ): Promise<Document | null> {
        options = this.getOptions(options);
        return super.findOneAndDelete(collectionName, filter, options);
    }

    async findOneAndReplace(
        collectionName: string,
        filter: Filter<Document>,
        replacement: Document,
        options?: FindOneAndReplaceOptions
    ): Promise<Document | null> {
        options = this.getOptions(options);
        return super.findOneAndReplace(collectionName, filter, replacement, options);
    }

    async findOneAndUpdate(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: FindOneAndUpdateOptions
    ): Promise<Document | null> {
        options = this.getOptions(options);
        return super.findOneAndUpdate(collectionName, filter, update, options);
    }

    initializeOrderedBulkOp(collectionName: string, options?: BulkWriteOptions): OrderedBulkOperation {
        options = this.getOptions(options);
        return this.getCollection(collectionName).initializeOrderedBulkOp(options);
    }

    initializeUnorderedBulkOp(collectionName: string, options?: BulkWriteOptions): UnorderedBulkOperation {
        options = this.getOptions(options);
        return this.getCollection(collectionName).initializeUnorderedBulkOp(options);
    }

    async insertMany(
        collectionName: string,
        docs: OptionalId<Document>[],
        options?: BulkWriteOptions
    ): Promise<InsertManyResult> {
        options = this.getOptions(options);
        return super.insertMany(collectionName, docs, options);
    }

    async insertOne(
        collectionName: string,
        doc: OptionalId<Document>,
        options?: InsertOneOptions
    ): Promise<InsertOneResult> {
        options = this.getOptions(options);
        return super.insertOne(collectionName, doc, options);
    }

    async replaceOne(
        collectionName: string,
        filter: Filter<Document>,
        replacement: Document,
        options?: ReplaceOptions
    ): Promise<Document | UpdateResult> {
        options = this.getOptions(options);
        return super.replaceOne(collectionName, filter, replacement, options);
    }

    async stats(collectionName: string, options?: CollStatsOptions): Promise<CollStats> {
        options = this.getOptions(options);
        return super.stats(collectionName, options);
    }

    watch(collectionName: string, pipeline?: Document[], options?: ChangeStreamOptions): ChangeStream {
        options = this.getOptions(options);
        return super.watch(collectionName, pipeline, options);
    }

    async updateMany(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: UpdateOptions
    ): Promise<Document | UpdateResult> {
        options = this.getOptions(options);
        return super.updateMany(collectionName, filter, update, options);
    }

    async updateOne(
        collectionName: string,
        filter: Filter<Document>,
        update: UpdateFilter<Document>,
        options?: UpdateOptions
    ): Promise<Document | UpdateResult> {
        options = this.getOptions(options);
        return super.updateOne(collectionName, filter, update, options);
    }
}
