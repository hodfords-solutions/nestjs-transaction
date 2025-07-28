import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './post.dto';
import { DataSource } from 'typeorm';
import { UseMasterNode } from '../../lib/decorators/use-master-node.decorator';
import { UseSlaveNode } from '../../lib/decorators/use-slave-node.decorator';
import { Transactional } from '../../lib';

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
    @Transactional()
    // @UseSlaveNode()
    createPost(@Body() dto: CreatePostDto): Promise<void> {
        return this.postService.createPost(dto);
    }
}
