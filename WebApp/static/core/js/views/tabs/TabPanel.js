/**
 * To be defined
 */
Ext.define('Ext.dirac.views.tabs.TabPanel', {
      extend : 'Ext.tab.Panel',
      requires : ["Ext.ux.TabReorderer"],
      xtype : 'diractabcontainer',
      alias : 'widget.tabPanel',
      resizeTabs : true,
      dragable : true,
      isLoaded : false,
      enableTabScroll : true,
      hasClose : false,
      activeTab : 0,
      layout : 'fit',
      tabChangeTimeout : null,
      tabChangeCycle : 0,
      tabCounter : 0,
      view : 'tabView',
      // renderTo:Ext.getBody(),
      /*
       * defaults : { autoScroll : true, bodyPadding : 10, bodyStyle: {
       * background: '#AAAAAA' }, },
       */
      bodyStyle : {
        background : '#AAAAAA'
      },
      workspace : null,
      plugins : [Ext.create('Ext.ux.TabReorderer')],
      setWorkspace : function(wsk) {
        this.workspace = wsk;
      },
      getWorkspace : function() {
        return this.workspace;
      },
      initComponent : function() {
        var me = this;
        me.callParent(arguments);
        /*
         * me.loadMask = new Ext.LoadMask(me, { msg : "Loading ..." });
         */
      },
      loadState : function(data) {
        var me = this;
        if (data && data.views && data.views.tabs && data.views.tabs.tabChangeCycle) {
          me.tabChangeCycle = data.views.tabs.tabChangeCycle;
          me.autoTabChange();
        }
      },
      /**
       * it returns the states of the applications
       * 
       * @return {Object}
       */
      getStateData : function() {
        var me = this;

        var desktop = {
          "dirac_view" : 1,
          "version" : GLOBAL.MAIN_VIEW_SAVE_STRUCTURE_VERSION,
          "data" : [],
          "views" : {
            "tabs" : {
              "version" : 1,
              "desktopGranularity" : me.desktopGranularity,
              "positions" : [],
              "tabChangeCycle" : me.tabChangeCycle
            }
          }
        };

        var apps = {};
        var toLoadApps = {};
        try {
          me.items.each(function(win, value, length) {
                // we have to select all the applications which are not loaded
                // and
                // they have the same state.
                if (!win.isLoaded) {
                  if (Object.keys(apps) && (Ext.Array.contains(Object.keys(apps), win.getAppClassName())) && apps[win.getAppClassName()] == win.currentState) {
                    toLoadApps[win.getAppClassName()] = win.currentState;
                  } else {
                    apps[win.getAppClassName()] = win.currentState;
                  }
                }
              });

          me.items.each(function(win, value, length) {
                // load the applications which have the same name. In this case
                // we
                // avoid to overwrite applications with wrong state.
                if (!win.isLoaded) {
                  if (Object.keys(toLoadApps) && (Ext.Array.contains(Object.keys(toLoadApps), win.getAppClassName()))) {
                    if (toLoadApps[win.getAppClassName()] == win.currentState) {
                      win.loadData();
                    }
                  }
                }
              });
          var oData = [];

          me.items.each(function(win, value, length) {

                /*
                 * Depends on the loadedObjectType
                 */
                var oElem = null;
                // We only save the applications which are loaded

                if (win.isLoaded) {

                  if (win.loadedObjectType == "app") {

                    var item = {
                      module : win.getAppClassName(),
                      data : win.loadedObject.getStateData(),
                      currentState : win.currentState,
                      loadedObjectType : win.loadedObjectType
                    };
                    // if we have some help text, it will be automatically
                    // saved.
                    Ext.apply(item.data, win.loadedObject.getHelpText());
                    oData.push(item);

                  } else if (win.loadedObjectType == "link") {

                    var item = {
                      link : win.linkToLoad,
                      loadedObjectType : win.loadedObjectType
                    };
                    Ext.apply(item.data, win.loadedObject.getHelpText());
                    oData.push(item);

                  }
                } else {
                  // We may have applications which are not opened. We have to
                  // save
                  // the status of this applications as well. These
                  // application
                  // states is retrieved from the SM.
                  var desktopName = me.title;
                  if (desktopName) { // && desktopName != 'Default'
                    if (GLOBAL.APP.SM.isStateLoaded("application", "desktop", desktopName) > -1) {
                      var oStateData = GLOBAL.APP.SM.getStateData("application", "desktop", desktopName);
                      for (var i = 0; i < oStateData.data.length; i++) {
                        if ((oStateData.data[i].module == win.getAppClassName()) && (oStateData.data[i].currentState == win.currentState))

                          oData.push(oStateData.data[i]);
                      }
                    } else if (desktopName == 'Default') {
                      var data = GLOBAL.APP.SM.getStateData("application", win.getAppClassName(), win.currentState);
                      // check if the application states is saved and not
                      // loaded, get the application state from the
                      // profile
                      // this can not happen....
                      if (data != -1) {
                        oData.push(data);
                      } else {

                        var item = {
                          currentState : win.currentState,
                          module : win.getAppClassName(),
                          data : win.loadedObject.getStateData()
                        };
                        Ext.apply(item.data, win.loadedObject.getHelpText());
                        oData.push(item);
                      }
                    } else {
                      Ext.dirac.system_info.msg("Error Notification", 'The following desktop can not be saved:' + desktopName);
                    }
                  }
                }

              });
          desktop.data = oData;
        } catch (err) {
          Ext.dirac.system_info.msg("Error Notification", 'The following desktop can not be saved:' + me.title);
          Ext.dirac.system_info.msg("Error Notification", "Error: " + err);
          desktop = null;
        }
        return desktop;
      },
      listeners : {
        beforeclose : function() {
          var me = this;
          var appContainer = GLOBAL.APP.MAIN_VIEW.getRightContainer().getApplicationContainer(); // we
          // have
          // to
          // set
          // the
          // active
          // tab
          // to
          // this
          // widget.
          if (appContainer) {
            appContainer.setActiveTab(me);
          }
          Ext.MessageBox.confirm('Confirm', 'There is an active desktop state. Do you want to save the current state?', function(button) {
                var me = this;
                if (button === 'yes') {
                  GLOBAL.APP.MAIN_VIEW.saveActiveDesktopState();
                } else {
                  me.doClose(); // generate a close event again.
                }

              }, me);
          return false; // it cancel the close of the tab. it wait until the
          // state
          // is saved.
        },
        close : function() {
          var me = this;
          Ext.Array.remove(GLOBAL.APP.MAIN_VIEW._state_related_url, me.title); // we
          // have
          // to
          // remove
          // the
          // desktop
          // from
          // the
          // list.
          if (me.title == 'Default') {
            GLOBAL.APP.MAIN_VIEW._default_desktop_state = []; // we closed the
            // default desktop!
          }
          GLOBAL.APP.SM.oprRemoveActiveState("desktop", me.title); // We have
          // to
          // remove the
          // desktop state
          // from the
          // list.
          GLOBAL.APP.MAIN_VIEW.currentState = ""; // the current state has to be
          // null;
          GLOBAL.APP.MAIN_VIEW.refreshUrlDesktopState();
        },
        tabchange : function(tabPanel, newCard, oldCard, eOpts) {
          var me = this;
          /*
           * if (oldCard != null) {
           * GLOBAL.APP.SM.oprRemoveActiveState("desktop", oldCard.title);// OK }
           */
          if (newCard.type == 'desktop') { // Ignore the change of the
            // applications

            GLOBAL.APP.MAIN_VIEW.currentState = newCard.title; // as we work
            // more
            // than one desktop,
            // we need to set
            // the current state
            // each time when a
            // tab has changed.
            // newCard.loadMask.show();
            if (!GLOBAL.APP.MAIN_VIEW.loading && !newCard.isLoaded && newCard.title != 'Default') {
              GLOBAL.APP.MAIN_VIEW.oprLoadDesktopState(newCard.title, newCard);
              newCard.isLoaded = true;
            } else if (newCard.title == 'Default') {
              // it is the default desktop. It is activated it means it is
              // loaded
              newCard.isLoaded = true;
            }
            if (oldCard) {
              GLOBAL.APP.SM.oprRemoveActiveState("desktop", oldCard.title);
              // we remove the old state. It is not active any more...
              me.syncronizeWithSettings(newCard); // we have to refresh the
              // Settings panel...
              if (newCard.plugins.length > 0) {
                for (var i = 0; i < newCard.plugins.length; i++) {
                  if (newCard.plugins[i].self.getName() == "Ext.ux.TabReorderer") {
                    newCard.initPlugin(newCard.plugins[i]);
                    break;
                  }
                }
              }
            }

          } else {// it is an application
            if (oldCard) {
              GLOBAL.APP.SM.oprRemoveActiveState(oldCard.getClassName(), oldCard.currentState);
              // remove the state form the active state list...
            }

            if (newCard.toLoad && !newCard.isLoaded) {
              newCard.loadData();
              newCard.isLoaded = true;
            }
          }
        },
        afterlayout : function() { // it has to be fired to initialize the
          // plugin.
          this.tabBar.fireEvent("afterLayout");
        }
      },
      /**
       * It is used to return a given tab.
       * 
       * @property tabName {String} tabName it returns the tab from the
       *           container.
       * @return tab {Ext.dirac.views.tabs.TabPanel}
       */
      getTab : function(tabName) {
        var tab = null;
        var me = this;
        me.items.each(function(tabObj, value, length) {
              console.log(tabObj);
              if (tabObj.title == tabName) {
                tab = tabObj;
                return;
              }
            });
        return tab;
      },
      /**
       * 
       * @property state
       * @return
       */
      getPanel : function(state) {
        var panel = null;
        var me = this;
        me.items.each(function(panelObj, value, length) {
              if (panelObj.currentState == state) {
                panel = panelObj;
                return;
              }
            });
        return panel;
      },
      getDesktop : function(desktop) {
        var panel = null;
        var me = this;
        me.items.each(function(panelObj, value, length) {
              if (panelObj.title == desktop) {
                panel = panelObj;
                return;
              }
            });
        return panel;
      },
      getApplicationsState : function() {
        var me = this;
        var states = [];
        me.items.each(function(panelObj, value, length) {
              states.push({
                    "module" : panelObj.appClassName,
                    "currentState" : panelObj.currentState
                  });
            });
        return states;
      },
      getApplicationTab : function(appClassName, stateName) {
        var me = this;
        var panel = null;
        me.items.each(function(panelObj, value, length) {
              if (panelObj.appClassName == appClassName && panelObj.currentState == stateName) {
                panel = panelObj;
                return;
              }
            });
        return panel;
      },
      setTabChangeTime : function(time) {
        var me = this;
        me.tabChangeCycle = time;
        clearInterval(me.tabChangeTimeout);
        if (me.tabChangeCycle > 0) {
          me.tabChangeTimeout = setInterval(function() {
                if (me.tabCounter < me.items.length) {
                  me.setActiveTab(me.tabCounter);
                  me.tabCounter += 1;
                } else {
                  me.tabCounter = 0;
                }

              }, me.tabChangeCycle);
        }
      },
      autoTabChange : function() {
        var me = this;
        var selPanel = GLOBAL.APP.MAIN_VIEW.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var settingPanel = selPanel.getSettimgsPanel().getDesktopSettingsPanel();
        }

        settingPanel.setDesktopName(me.title);
        if (settingPanel && me.tabChangeCycle > 0) {
          me.setTabChangeTime(me.tabChangeCycle);
          settingPanel.setTabChangePeriod(me.tabChangeCycle);

        } else {
          if (me.tabChangeTimeout) {
            clearInterval(me.tabChangeTimeout);
          }
          settingPanel.setTabChangePeriod(me.tabChangeCycle);
        }
      },
      syncronizeWithSettings : function(tab) {
        var selPanel = GLOBAL.APP.MAIN_VIEW.getLeftContainer().getSelectionPanel();
        if (selPanel) {
          var settingPanel = selPanel.getSettimgsPanel().getDesktopSettingsPanel();
        }
        settingPanel.setDesktopName(tab.title);
        if (settingPanel && tab.tabChangeCycle) {
          settingPanel.setTabChangePeriod(tab.tabChangeCycle);
        } else {
          settingPanel.setTabChangePeriod(0);
        }
      }

    });
