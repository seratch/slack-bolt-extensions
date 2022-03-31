import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SlackController } from './app.controller';
import { SlackBoltMiddleware } from './app.middleware';

@Module({
  imports: [],
  controllers: [SlackController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SlackBoltMiddleware).forRoutes('');
  }
}
