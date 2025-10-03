import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './post.dto';
import { DataSource } from 'typeorm';
import { UseMasterNode, UseSlaveNode, Transactional } from '@hodfords/nestjs-transaction';

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
    createPost(@Body() dto: CreatePostDto, @Req() a: any): Promise<void> {
        return this.postService.createPost(dto);
    }
}
