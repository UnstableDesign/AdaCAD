import { WorldWarpWeftPage } from './app.po';

describe('world-warp-weft App', () => {
  let page: WorldWarpWeftPage;

  beforeEach(() => {
    page = new WorldWarpWeftPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
