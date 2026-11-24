import { Container, Sprite } from 'pixi.js';
import type { GameAssets } from '../assets';


export class Reel extends Container {
 
  constructor(strip: number[],assets: GameAssets,rows : number,colWidth: number,rowHeight: number) {
  super();
  }
}
