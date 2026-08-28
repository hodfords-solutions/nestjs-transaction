import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreatePostDto } from './post.dto.js';
import { PostEntity } from './post.entity.js';
import { PostRepository } from './post.repository.js';
import { getDataSource } from '@hodfords/typeorm-helper';
import { runAfterTransactionCommit, Transactional } from '@hodfords/nestjs-transaction';

@Injectable()
export class PostService {
    private logger = new Logger(PostService.name);
    constructor(private postRepo: PostRepository) {}

    async createPost(dto: CreatePostDto): Promise<void> {
        runAfterTransactionCommit(() => this.emitPostCreatedEvent());
        // await this.emitPostCreatedEvent();
        await this.postRepo.insert(dto);
        await this.createPostWithEntity();
        await this.createPostWithQueryRunner();
        await this.createPostWithQueryRunnerAndExternalDataSource();
        await this.createPostWithQueryBuilder();
        await this.createPostWithQueryBuilderAndExternalDataSource();
        await this.createPostWithRawQuery();
        // throw new BadRequestException('Random error occurred');
    }

    async createPostWithEntity() {
        this.logger.log('Creating post with entity');
        const post = new PostEntity();
        post.title = 'Post with Entity';
        post.content = 'This is a post created using entity.';
        await this.postRepo.save(post);
    }

    async createPostWithQueryRunner(): Promise<void> {
        this.logger.log('Creating post with query runner');
        const dto = {
            title: 'Post with Query Runner',
            content: 'This is a post created using query runner.'
        };
        const queryRunner = this.postRepo.manager.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const post = new PostEntity();
            post.title = dto.title;
            post.content = dto.content;

            await queryRunner.manager.save(post);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Failed to create post with query runner');
        }
    }

    async createPostWithQueryBuilder(): Promise<void> {
        this.logger.log('Creating post with queryBuilder');
        const dto = {
            title: 'Post with Query Builder',
            content: 'This is a post created using query builder.'
        };
        const queryBuilder = this.postRepo.createQueryBuilder('post');
        await queryBuilder.insert().into(PostEntity).values(dto).execute();
    }

    async createPostWithQueryRunnerAndExternalDataSource(): Promise<void> {
        this.logger.log('Creating post with queryRunner and external data source');
        const dataSource = getDataSource();
        const dto = {
            title: 'Post with External Data Source',
            content: 'This is a post created using an external data source.'
        };
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const post = new PostEntity();
            post.title = dto.title;
            post.content = dto.content;

            await queryRunner.manager.save(post);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException('Failed to create post with external data source');
        }
    }

    async createPostWithQueryBuilderAndExternalDataSource(): Promise<void> {
        this.logger.log('Creating post with queryBuilder and external data source');
        const dataSource = getDataSource();
        const dto = {
            title: 'Post with Query Builder and External Data Source',
            content: 'This is a post created using query builder with an external data source.'
        };
        const queryBuilder = dataSource.createQueryBuilder();
        await queryBuilder.insert().into(PostEntity).values(dto).execute();
    }

    @Transactional()
    async createPostWithRawQuery(): Promise<void> {
        this.logger.log('Creating post with rawQuery');
        const dto = {
            title: 'Post with Raw Query',
            content: 'This is a post created using query.'
        };
        const dataSource = getDataSource();
        await dataSource.query(`INSERT INTO posts (title, content) VALUES ($1, $2)`, [dto.title, dto.content]);
    }

    // @RunAfterTransactionCommit()
    // @Transactional()
    async emitPostCreatedEvent(): Promise<void> {
        await this.postRepo.insert({
            title: 'Post with Created Post',
            content: 'This is a post created using the created post event.'
        });
        this.logger.warn(`Post created event emitted`);
    }

    async getPosts(): Promise<PostEntity[]> {
        await this.postRepo.find();
        await this.postRepo.find();
        await this.postRepo.find();
        return this.postRepo.find();
    }
}
