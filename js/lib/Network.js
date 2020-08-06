import * as $ from 'jquery';
import * as Store from '../store/Store.js';

let isAppOffline = false;

/**
 * Make an XHR to the server
 *
 * @param {string} command
 * @param {mixed} data
 * @param {string} [type]
 * @returns {$.Deferred}
 */
function request(command, data, type) {
  const promise = new $.Deferred();
  $.ajax({
    url: `https://www.expensify.com.dev/api?command=${command}`,
    type: type || 'post',
    data: {
      authToken: Store.get('session', 'authToken'),
      ...data,
    },
  })
    .done((responseData) => {
      if (responseData.jsonCode === 200) {
        return promise.resolve(responseData);
      }
      console.error('API Error:', responseData);
      promise.reject(responseData.message);
    })
    .fail((xhr) => {
      isAppOffline = true;
      promise.reject();
    });

  return promise;
}

// Holds a queue of all the write requests that need to happen
const delayedWriteQueue = [];

/**
 * A method to write data to the API in a delayed fashion that supports the app being offline
 *
 * @param {string} command
 * @param {midex} data
 * @returns {$.Deferred}
 */
function delayedWrite(command, data, cb) {
  const promise = $.Deferred();

  // Add the write request to a queue of actions to perform
  delayedWriteQueue.push({
    command,
    data,
    promise,
  });

  return promise;
}

/**
 * Process the write queue by looping through the queue and attempting to make the requests
 */
function processWriteQueue() {
  if (isAppOffline) {
    // Make a simple request to see if we're online again
    request('Get', null, 'get').done(() => {
      isAppOffline = false;
    });
    return;
  }

  if (delayedWriteQueue.length === 0) {
    return;
  }

  for (let i = 0; i < delayedWriteQueue.length; i++) {
    // Take the request object out of the queue and make the request
    const delayedWriteRequest = delayedWriteQueue.shift();

    request(delayedWriteRequest.command, delayedWriteRequest.data)
      .done(delayedWriteRequest.promise.resolve)
      .fail(() => {
        // If the request failed, we need to put the request object back into the queue
        delayedWriteQueue.push(delayedWriteRequest);
      });
  }
}

// TODO: Figure out setInterval
// Process our write queue very often
// setInterval(processWriteQueue, 1000);

export {request, delayedWrite};
