import { Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { DataSource } from 'typeorm';
import { UseSlaveNode, Transactional, UseMasterNode } from '@hodfords/nestjs-transaction';

@Controller('posts')
export class PostController {
    constructor(
        private dateSource: DataSource,
        private postService: PostService
    ) {
        console.log('Start');
    }

    @Get()
    @UseSlaveNode()
    get() {
        return this.postService.getPosts();
    }

    @Post()
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseMasterNode()
    @Transactional()
    createPost(@Req() a: any): Promise<void> {
        return this.postService.createPost({
            title: 'Post Title',
            content: 'Post Content'
        });
    }
}
