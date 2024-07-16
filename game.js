const crypto = require('crypto');
const { Command } = require('commander');
const program = new Command();
const Table = require('cli-table3');

class KeyGenerator {
  static generateKey(length = 256) {
    return crypto.randomBytes(length / 8).toString('hex');
  }
}

class HMACGenerator {
  static generateHMAC(key, message) {
    return crypto.createHmac('sha256', key).update(message).digest('hex');
  }
}

class MoveDetermination {
  constructor(moves) {
    this.moves = moves;
    this.moveCount = moves.length;
    this.halfCount = Math.floor(this.moveCount / 2);
  }

  determineWinner(move1, move2) {
    const index1 = this.moves.indexOf(move1);
    const index2 = this.moves.indexOf(move2);

    if (index1 === index2) {
      return "Draw";
    } else if ((index2 > index1 && index2 <= index1 + this.halfCount) || (index2 < index1 && index2 <= (index1 + this.halfCount) % this.moveCount)) {
      return `${move2} wins against ${move1}`;
    } else {
      return `${move1} wins against ${move2}`;
    }
  }
}

class HelpTable {
  constructor(moves) {
    this.moves = moves;
  }

  generateTable() {
    const table = new Table({ head: ['v PC/User >', ...this.moves] });
    this.moves.forEach(move => {
      const row = [move];
      this.moves.forEach(opponentMove => {
        const result = new MoveDetermination(this.moves).determineWinner(move, opponentMove);
        if (result === "Draw") {
          row.push('Draw');
        } else if (result.startsWith(move)) {
          row.push('Win');
        } else {
          row.push('Lose');
        }
      });
      table.push(row);
    });
    return table.toString();
  }
}

function validateMoves(moves) {
  if (moves.length < 3) {
    throw new Error("You must provide at least 3 moves.");
  }

  if (moves.length % 2 === 0) {
    throw new Error("The number of moves must be an odd number.");
  }

  const uniqueMoves = new Set(moves);

  if (uniqueMoves.size !== moves.length) {
    throw new Error("Moves must be unique.");
  }

  return Array.from(uniqueMoves);
}

function main() {
  program
    .version('1.0.0')
    .arguments('<moves...>')
    .action(moves => {
      try {
        moves = validateMoves(moves);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        program.help();
        process.exit(1);
      }

      const key = KeyGenerator.generateKey();
      const computerMove = moves[Math.floor(Math.random() * moves.length)];
      const hmac = HMACGenerator.generateHMAC(key, computerMove);

      console.log(`HMAC: ${hmac}`);
      console.log('Menu:');
      moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
      console.log('0 - Exit');

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Enter your move: ', userInput => {
        const userMoveIndex = parseInt(userInput, 10) - 1;

        if (userInput === '0') {
          console.log('Exiting...');
          readline.close();
          process.exit(0);
        }

        if (isNaN(userMoveIndex) || userMoveIndex < 0 || userMoveIndex >= moves.length) {
          console.error('Invalid input. Please try again.');
          readline.close();
          main();
          return;
        }

        const userMove = moves[userMoveIndex];
        console.log(`Your move: ${userMove}`);
        console.log(`Computer's move: ${computerMove}`);
        console.log(`Key: ${key}`);

        const result = new MoveDetermination(moves).determineWinner(userMove, computerMove);
        console.log(result);

        readline.close();
      });
    });

  program
    .command('help')
    .description('Show help table')
    .action(() => {
      const moves = program.args.slice(0, -1);
      try {
        validateMoves(moves);
      } catch (error) {
        console.error(`Error: ${error.message}`);
        program.help();
        process.exit(1);
      }

      const table = new HelpTable(moves).generateTable();
      console.log(table);
    });

  program.parse(process.argv);

  if (process.argv.length < 3) {
    console.error('Error: You must provide at least 3 moves.');
    program.help();
    process.exit(1);
  }
}

main();
