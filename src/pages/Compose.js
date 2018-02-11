import './css/compose.css';
import actions, { db } from '../actions';

import GridObject from '../utils/Grid';
import React, { Component } from 'react';
import Editor from '../components/Editor';
import Create from '../components/Create';
import EditableSpan from '../components/EditableSpan';
import { lazy } from '../jsUtils';
import { makeGrid, makeEmptyClues } from '../gameUtils';

import { getId, loggedIn, registerLoginListener } from '../auth';

export default class Compose extends Component {

  constructor() {
    super();
    this.state = {
      composition: undefined,
      myCompositions: [],
    };
    this.cid = undefined;
    registerLoginListener(() => {
      this.me = getId();
      this.myCompositionsRef = db.ref('myPuzzles/' + this.me);
      this.myCompositionsRef.on('value', lst => {
        this.setState({
          myCompositions: (lst.val() || []).reverse()
        });
      });
    });
    this.color = 'rgb(118, 226, 118)';
  }

  selectComposition(cid) {
    if (this.compositionRef) {
      this.compositionRef.off();
    }
    this.cid = cid;
    this.compositionRef = db.ref('composition/' + cid);
    this.compositionRef.on('value', _composition => {
      lazy('updateComposition', () => {
        const composition = _composition.val() || {};
        this.composition = composition;
        this.setState({ composition: this.composition });
      });
    });
  }

  newComposition({dims, pattern}) {
    const type = Math.max(dims.r, dims.c) <= 7
      ? 'Mini Puzzle'
      : 'Daily Puzzle';
    const composition = {
      info: {
        title: 'Untitled',
        type: type,
        author: 'Anonymous'
      },
      grid: makeGrid(pattern.map(row => row.map(cell => (
        cell === 0 ? '' : '.'
      )))).toArray(),
      private: true,
    };
    composition.clues = makeEmptyClues(composition.grid),
      actions.createComposition(pattern, ({cid}) => {
        this.myCompositionsRef.transaction((lst = []) => (
          [...lst, {
            cid: cid,
            title: 'Untitled',
            dims: {
              rows: dims.r,
              cols: dims.c
            },
          }]
        ))
        this.selectComposition(cid)
      });
  }

  updateDims(height, width) {
  }

  transaction(fn, cbk) {
    this.compositionRef.transaction(fn, cbk);
    this.composition = fn(this.composition);
    this.setState({composition: this.composition});
  }

  cellTransaction(r, c, fn) {
    this.compositionRef.child('grid/' + r + '/' + c).transaction(fn);
    this.composition.grid[r][c] = fn(this.composition.grid[r][c])
    this.setState({ composition: this.composition });
  }

  updateGrid(r, c, value) {
    this.cellTransaction(r, c, cell => ({
      ...cell,
      value: value,
      bad: false,
      good: false,
    }));
  }

  clueTransaction(ori, idx, fn, cbk) {
    this.compositionRef.child('clues/' + ori + '/' + idx).transaction(fn, cbk);
    this.composition.clues[ori][idx] = fn(this.composition.clues[ori][idx]);
    this.setState({ composition: this.composition });
  }

  updateClues(ori, idx, value) {
    this.clueTransaction(ori, idx, clue => value);
  }

  flipColor(r, c) {
    console.log('flip color', this.composition.grid[r][c]);
    this.composition.grid[r][c].black = !this.composition.grid[r][c].black;
    new GridObject(this.composition.grid).assignNumbers();
    this.composition.clues = new GridObject(this.composition.grid).alignClues(this.composition.clues);
    this.compositionRef.set(this.composition);
    this.setState({ composition: this.composition });
  }

  getCellSize() {
    return 30 * 15 / this.composition.grid[0].length;
  }

  updateTitle(title) {
    this.compositionRef.transaction(composition => ({
      ...composition,
      info: {
        ...composition.info,
        title,
      }
    }));
    this.myCompositionsRef.transaction(lst => {
      lst.forEach(entry => {
        if (entry.pid === this.pid) {
          entry.title = title;
        }
      });
      return lst;
    });
  }

  updateAuthor(author) {
    this.transaction(composition => ({
      ...composition,
      info: {
        ...composition.info,
        author: author
      }
    }));
  }

  renderMain() {
    if (!this.composition) {
      return (
        <div className='compose--main'>
          <div className='compose--main--select-a-puzzle'>
            Select a puzzle from the left sidebar
          </div>
        </div>
      );
    }
    return (
      <div className='compose--main'>
        <div className='compose--main--info'>
          <div className='compose--main--info--title'>
            <EditableSpan
              value={this.composition.info.title}
              onChange={this.updateTitle.bind(this)}
            />
          </div>
        </div>
        <div className='compose--main--info--subtitle'>
          {
            this.composition.info.type + ' | '
              + 'By '
          }
          <EditableSpan
            value={this.composition.info.author}
            onChange={this.updateAuthor.bind(this)}
          />
        </div>
        <div className='compose--main--editor'>
          <Editor
            ref='editor'
            size={this.getCellSize()}
            grid={this.composition.grid}
            clues={this.composition.clues}
            updateGrid={this.updateGrid.bind(this)}
            updateClues={this.updateClues.bind(this)}
            onFlipColor={this.flipColor.bind(this)}
            myColor={this.color}
            pid={this.pid}
          />
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className='compose'>
        <div className='compose--left'>
          <div className='compose--left--top'>
            <h2> Your Puzzles </h2>
          </div>
          <div className='compose--left--list'>
            {
              this.state.myCompositions.map((entry, i) =>
                <div
                  key={i}
                  onClick={this.selectComposition.bind(this, entry.pid)}
                  className='compose--left--list--entry'>
                  <div>
                    { entry.title } ({ entry.dims.rows } x { entry.dims.cols })
                  </div>
                </div>
              )
            }
          </div>
          <div
            className='compose--left--new'>
            <h2> New Puzzle </h2>
            <Create
              onCreate={this.newComposition.bind(this)}
            />
          </div>
        </div>
        { this.renderMain() }
        <div className='compose--right'>
          <div className='compose--right--top'>
            <h2> Instructions </h2>
            <div>
              <p>Here you can browse, edit or create new puzzles.</p>

              <p> Click on the grid, and use arrow keys to navigate the grid.</p>

              <p>Press Enter to edit the clue for the word that's currently selected.</p>

              {
                this.cid
                  ?(
                    <p>
                      If you publish your puzzle.

                      { this.composition.published
                          ? (
                            <div>
                              Published on {this.composition.published.date}
                              <a href={this.composition.published.pid}></a>
                              <button>Unpublish</button>
                            </div>
                          )
                          : (
                            <div>
                              <button>Publish to Down for a Cross</button>
                            </div>
                          )
                      }
                      <button>Export as puz file</button>
                    </p>
                  )
                  : null
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
};
