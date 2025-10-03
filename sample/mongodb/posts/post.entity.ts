import { Column, Entity, ObjectIdColumn, ObjectId } from 'typeorm';

@Entity('posts')
export class PostEntity {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    title: string;

    @Column()
    content: string;
}
