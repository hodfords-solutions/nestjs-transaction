import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('posts')
export class PostEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    title: string;

    @Column()
    content: string;
}
