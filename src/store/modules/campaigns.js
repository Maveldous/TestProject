import {
  mixinDialogMutations,
  mixinDialogActions,
  mixinDialogGetters
} from '../../mixins/vuex_dialogs';
import {
  mixinSetLoading
} from '../../mixins/vuex_loading';

// import i18n from '../../i18n';

export default {
  namespaced: true,
  state: {
    campaigns: {
      all: [],
      selected: localStorage.getItem('adsmanager-campaigns-selected') ?
        JSON.parse(localStorage.getItem('adsmanager-campaigns-selected')) : [],
      filtered: [],
    },
    stat: [],
    filters: {
      name: '',
      statuses: typeof localStorage.getItem('accounts-filters-statuses') === 'undefined' ? [] : JSON.parse(localStorage.getItem('accounts-filters-statuses')),
    },
    dialogs: {
      changeBudget: false,
      pause: false,
      start: false,
      duplicate: false,
    },
    loading: {
      mainTable: false,
    },

  },
  getters: {
    ...mixinDialogGetters,

    campaigns: state => state.campaigns,
    selected: state => state.campaigns.selected,
    loading: state => state.loading,
    stat: state => state.stat,
  },
  mutations: {
    ...mixinDialogMutations,
    ...mixinSetLoading,

    FILTER: state => {
      state.campaigns.filtered = state.campaigns.all;
    },

    SET_STAT: (state, stat) => {
      state.stat = stat;
    },

    SET_SELECTED: (state, data) => {
      state.campaigns.selected = data;
      localStorage.setItem('adsmanager-campaigns-selected', JSON.stringify(data));
    },

    SET_ALL: (state, payload) => {
      state.campaigns.all = payload;
    },

    SET_FILTERED: (state, payload) => {
      state.campaigns.filtered = payload;
    },
    SET_FILTERS_NAME: (state, payload) => {
      state.filters.name = payload;
    },
    FILTER_CAMPAIGNS (state) {
      let campaigns = state.campaigns.all;
      const filters = state.filters;

      if (filters.name) {
        if (filters.name.length > 0) {
          campaigns = campaigns.filter(campaign => {
            return (
              campaign.name.toString().toLowerCase().search(filters.name.toLowerCase()) !== -1
            );
          });
        }
      }

      if (filters.statuses && filters.statuses.length > 0) {
        campaigns = campaigns.filter(function(campaign) {
          return filters.statuses.indexOf(campaign.status) > -1;
        });
      }

      if (this.state.adsmanager.filters.tags && this.state.adsmanager.filters.tags.length > 0) {
        campaigns = campaigns.filter(campaign => {
          return this.state.adsmanager.filters.tags.some(tag => {
            if (!Array.isArray(campaign.tags)) return false;
            return campaign.tags.indexOf(tag.toString()) > -1;
          });
        });
      }
      
      state.campaigns.filtered = campaigns;
    },
  },
  actions: {
    ...mixinDialogActions,

    async setFiltersName(context, payload) {
      context.commit('SET_FILTERS_NAME', payload);
      context.commit('FILTER_CAMPAIGNS');
    },

    async loadCampaigns({commit, rootState, dispatch}) {
      const data = {
        users_ids: rootState.users.users.selected.length > 0 ?
          rootState.users.users.selected.map(user => user.id) :
          rootState.users.users.all.length === 0 ?
            -1 : rootState.users.users.filtered.map(user => user.id),
        accounts_ids: rootState.accounts.accounts.selected.length > 0 ?
          rootState.accounts.accounts.selected.map(account => account.id) :
          rootState.accounts.accounts.all.length === 0 ?
            -1 : rootState.accounts.accounts.filtered.map(account => account.id),
        cabs_ids: rootState.cabs.cabs.selected.length > 0 ?
          rootState.cabs.cabs.selected.map(cab => cab.id) :
          rootState.cabs.cabs.all.length === 0 ?
            -1 : rootState.cabs.cabs.filtered.map(cab => cab.id),
      };

      console.log(JSON.stringify(data));
      
      const response = await this._vm.api.post('/campaigns', data);
      if (response.data.success) {
        response.data.data.forEach(campaign => {
          console.log(campaign.campaign_id);
        });
        commit('SET_ALL', response.data.data);
        commit('FILTER');
        dispatch('loadStat');
      }
    },

    async loadStat({
      dispatch,
      commit,
      rootState
    }) {
      commit('SET_LOADING', {
        param: 'mainTable',
        value: true,
      });

      const data = {
        ids: rootState.campaigns.campaigns.filtered.map(campaign => campaign.id),
        dates: rootState.adsmanager.filters.dates,
      };
      console.log(JSON.stringify(data));
      const response = await this._vm.api.post('/stat/by_campaign', data).catch((e) => {
        dispatch('main/apiError', e, {
          root: true
        });
      });

      commit('SET_LOADING', {
        param: 'mainTable',
        value: false,
      });

      commit('SET_STAT', response.data.data);
    },

    async saveSelected(context, data) {
      context.commit('SET_SELECTED', data);
    },

    async clearSelected(context) {
      context.commit('SET_SELECTED', []);
    },

    async clear(context) {
      context.commit('SET_ALL', []);
      context.commit('SET_FILTERED', []);
      context.commit('SET_SELECTED', []);
    }
  }
};