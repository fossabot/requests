const qs = require('querystring')
const fetch = require('node-fetch')

const requestFns = {
  facebook: async (args, token) => {
    if (!args) args = {}
    args['access_token'] = token
    return (await fetch('https://graph.facebook.com/v2.10/me' + '?' + qs.stringify(args))).json()
  },

  github: async (action, token) => {
    return (await fetch('https://api.github.com/' + action, {
      headers: {
        'Authorization': 'token ' + token
      }
    })).json()
  },

  stripe: async (action, args, method) => {
    const url = 'https://api.stripe.com/v1/' + action + (args ? '?' + qs.stringify(args) : '')
    return (await fetch(url, {
      method: !method ? 'GET' : method,
      headers: {
        'Authorization': 'Bearer ' + process.env.PROUX_STRIPE_SECRET
      }
    })).json()
  },

  httpNet: async (scope, action) => {
    return (await fetch('https://partner.http.net/api/' + scope + '/v1/json/' + action, {
      method: 'POST',
      body: JSON.stringify({
        limit: '1000',
        authToken: process.env.HTTP_NET_KEY
      })
    })).json().then(result => result.response.data)
  },

  mailboxOrg: async function (action, args) {
    const reqData = {
      method: 'POST',
      headers: {},
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: action,
        params: args,
        id: process.hrtime().join('-')
      })}

    if (action !== 'auth') {
      reqData.headers['HPLS-AUTH'] = (await requestFns.mailboxOrg('auth', {
        user: process.env.MAILBOX_ORG_ACCOUNT,
        pass: process.env.MAILBOX_ORG_PASSWORD
      })).session
    }

    return (await fetch('https://api.mailbox.org/v1/', reqData))
      .json()
      .then(result => result.result)
  }
}

module.exports = requestFns
