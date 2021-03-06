import assert from 'assert';
import Promise from 'bluebird';
import Rx from 'rx';
import React from 'react';
import Async, {renderToString} from '../';

function defineObservableValue(value) {
  return {
    id: null,
    start() {
      return Rx.Observable.fromPromise(Promise.delay(0).then(() => value));
    }
  };
}

describe('ReactAsync.renderToString (server)', function() {

  it('fetches data before rendering a component', function(done) {

    function observe() {
      return {message: defineObservableValue('hello')};
    }

    @Async(observe)
    class Component extends React.Component {

      render() {
        return <div className={this.props.className}>{this.props.message}</div>;
      }
    }

    renderToString(<Component />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {id: null, data: 'hello', completed: true}});
      done();
    });
  });

  it('fetches data before rendering a component with observe defined inline', function(done) {

    @Async
    class Component extends React.Component {

      static observe() {
        return {message: defineObservableValue('hello')};
      }

      render() {
        return <div className={this.props.className}>{this.props.message}</div>;
      }
    }

    renderToString(<Component />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {id: null, data: 'hello', completed: true}});
      done();
    });
  });

  it('fetches data before rendering a component defined with React.createClass', function(done) {

    function observe() {
      return {message: defineObservableValue('hello, legacy')};
    }

    let LegacyComponent = React.createClass({
      render() {
        return <div>{this.props.message}</div>;
      }
    });

    LegacyComponent = Async(LegacyComponent, observe);

    renderToString(<LegacyComponent />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {id: null, data: 'hello, legacy', completed: true}});
      done();
    });
  });

  it('fetches data before rendering a component deep nested', function(done) {

    @Async
    class Component extends React.Component {
      static observe() {
        return {message: defineObservableValue('hello')};
      }

      render() {
        return <div className={this.props.className}>{this.props.message}</div>;
      }
    }

    class Outer extends React.Component {

      render() {
        return <Component />;
      }
    }

    renderToString(<Outer />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);

      assert.equal(Object.keys(data).length, 1)
      let id = Object.keys(data)[0];
      assert.ok(data[id]);
      assert.deepEqual(data[id], {message: {id: null, data: 'hello', completed: true}});

      done();
    });
  });

  it('handles async components which have same root node id', function(done) {

    @Async
    class Component extends React.Component {

      static observe() {
        return {message: defineObservableValue('hello')};
      }

      render() {
        return <div className={this.props.className}>{this.props.message}</div>;
      }
    }

    @Async
    class OuterAsync extends React.Component {

      static observe() {
        return {className: defineObservableValue('outer')};
      }

      render() {
        return <Component className={this.props.className} />;
      }
    }

    renderToString(<OuterAsync />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('outer') > -1);

      assert.equal(Object.keys(data).length, 2)
      done();
    });
  });

  it('should automatically inject data when only two callback arguments are provided', function(done) {

    @Async
    class Component extends React.Component {

      static observe() {
        return {message: defineObservableValue('hello')};
      }

      render() {
        return <div>{this.props.message}</div>;
      }
    }

    renderToString(<Component />, function(err, markup) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncDataPacket__ = {') > -1);

      done();
    });

  })

  it('should not inject data when three callback arguments are provided', function(done) {

    @Async
    class Component extends React.Component {

      static observe() {
        return {message: defineObservableValue('hello')};
      }

      render() {
        return <div>{this.props.message}</div>;
      }
    }

    renderToString(<Component />, function(err, markup, data) {
      if (err) {
        return done(err);
      }

      assert.ok(markup.indexOf('hello') > -1);
      assert.ok(markup.indexOf('<script>window.__reactAsyncDataPacket__ = {') < 0);

      done();
    });

  });

});
