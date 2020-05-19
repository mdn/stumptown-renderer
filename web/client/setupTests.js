import React from "react";

// localStorage mock for tests
const mockLocalStorage = () => {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    removeItem: function (key) {
      delete store[key];
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
  };
};

global.localStorage = mockLocalStorage();
