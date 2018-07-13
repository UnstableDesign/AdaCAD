import { WorldWideWeftPage } from './app.po';

describe('world-wide-weft App', () => {
  let page: WorldWideWeftPage;

  beforeEach(() => {
    page = new WorldWideWeftPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
