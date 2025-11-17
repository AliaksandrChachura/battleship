enum MessageType {
  REG = 'reg',
  UPDATE_WINNERS = 'update_winners',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  CREATE_GAME = 'create_game',
  UPDATE_ROOM = 'update_room',
  ADD_SHIPS = 'add_ships',
  START_GAME = 'start_game',
  ATTACK = 'attack',
  RANDOM_ATTACK = 'randomAttack',
  TURN = 'turn',
  FINISH = 'finish',
  SINGLE_PLAY = 'single_play',
}

const SHIP_CONFIGS: {
  type: 'small' | 'medium' | 'large' | 'huge';
  length: number;
}[] = [
  { type: 'huge', length: 4 },
  { type: 'large', length: 3 },
  { type: 'medium', length: 2 },
  { type: 'small', length: 1 },
];

export { MessageType, SHIP_CONFIGS };
