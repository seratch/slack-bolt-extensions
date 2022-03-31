import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class SlackController {
  constructor() {}

  @Get()
  root(@Res() res): void {
    res.redirect('/slack/install');
  }
}
