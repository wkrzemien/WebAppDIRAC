/**
 * This class show different applications in a single panel.
 */
Ext.define('Ext.dirac.views.tabs.Presenter', {
      extend : 'Ext.panel.Panel',
      requires : ['Ext.dirac.views.tabs.PanelDragDrop', 'Ext.panel.Tool'],
      autoScroll : true,
      frame : true,
      lastClickedImage : null,
      columnWidth : 3,
      maxColumns : 6,
      refreshCycle : 0,
      collapsible : true,
      tabheader : false,
      layout : 'column',
      /*
       * layout : { type: 'table', columns : 3 }, defaults: { frame:true,
       * width:'70%', height: '70%', style: 'margin: 0 2px 2px 0' },
       */
      margins : '2 0 2 0',
      monitorResize : true,
      multiSelect : true,
      plugins : ['paneldragdrop'],
      listeners : {
        afterlayout : function(widget, layout, eOpts) {
          var me = this;
          me.setApplicationsHeader(me.tabheader);
        }
      },
      tools : [{
            type : 'refresh',
            tooltip : 'Setting the refresh period',
            callback : function(panel, tool) {
              delete panel.refreshMenu;
              panel.refreshMenu = null;
              panel.refreshMenu = Ext.create('Ext.menu.Menu', {
                    listeners : {
                      click : function(menu, menuItem, e, eOpts) {
                        panel.setRefreshCycle(menuItem.value);
                      }
                    }
                  });

              for (var i in panel.menuItems) {
                var item = null;
                if (panel.menuItems[i] == '-1') {
                  item = Ext.create('Ext.menu.Item', {
                        text : i,
                        value : panel.menuItems[i]
                      });
                } else {
                  item = new Ext.menu.CheckItem({
                        checked : (panel.menuItems[i] == panel.refreshCycle) ? true : false,
                        group : 'column',
                        value : panel.menuItems[i],
                        text : i
                      });
                }
                panel.refreshMenu.add(item);
              }
              panel.refreshMenu.showBy(tool.el);
            }
          }, {
            'type' : 'gear',
            tooltip : 'Change the column width',
            scope : this,
            callback : function(panel, tool) {
              var width = 99;
              delete panel.columnMenu;
              delete panel.headerMenu;
              panel.columnMenu = null;
              panel.headerMenu = null;
              panel.columnMenu = new Ext.menu.Menu();
              for (i = 1; i < panel.maxColumns; i++) {
                var item = new Ext.menu.CheckItem({
                      value : i,// ??? maybe there is a way to get the position
                      // of the item in a container??
                      checked : (i == panel.columnWidth) ? true : false,
                      checkHandler : function(item, checked) {
                        if (checked) {
                          panel.setColumnWidth(item.value);
                        }
                      },
                      group : 'column',
                      text : (i > 1) ? i + ' Columns' : i + ' Column'
                    });
                panel.columnMenu.add(item);
              }

              panel.headerMenu = Ext.menu.Menu({
                    items : [{
                          xtype : 'menucheckitem',
                          text : "Disable",
                          checked : (panel.tabheader == false ? true : false),
                          group : 'columnHeader',
                          value : 'menuDisable',
                          checkHandler : function(item, checked) {
                            if (checked) {
                              panel.tabheader = false;
                              panel.setApplicationsHeader(false);
                            }
                          }
                        }, {
                          xtype : 'menucheckitem',
                          text : "Enable",
                          group : 'columnHeader',
                          value : 'menuEnable',
                          checked : (panel.tabheader == true ? true : true),
                          checkHandler : function(item, checked) {
                            if (checked) {
                              panel.tabheader = true;
                              panel.setApplicationsHeader(true);
                            }
                          }
                        }]
                  });
              panel.menu = new Ext.menu.Menu({
                    items : [{
                          text : 'Collumns',
                          menu : panel.columnMenu
                        }, {
                          text : 'Header',
                          menu : panel.headerMenu
                        }]
                  });

              panel.menu.showBy(tool.el);
            }
          }],// it hides the header of the Presenter page!!!
      /*
       * listeners : { render: function (oElem, eOpts) { var me = this;
       * me.header.hide(); me.mon(oElem.el, 'mouseover', function (event, html,
       * eOpts) { me.header.show(); }, me); me.mon(oElem.el, 'mouseout',
       * function (event, html, eOpts) { me.header.hide(); }, me); } },
       */
      loadState : function(oData) {
        var me = this;
        me.columnWidth = oData.columnWidth;
        me.setColumnWidth(me.columnWidth);

        me.refreshCycle = oData.refreshCycle;
        me.setRefreshCycle(me.refreshCycle);
        me.tabheader = oData.tabheader;

      },
      getStateData : function() {

        var me = this;
        var result = {
          data : []
        };

        if (me.items.length > 0) {
          for (var i = 0; i < me.items.length; i++) {
            win = me.items.getAt(i);
            /*
             * Depends on the loadedObjectType
             */
            var oElem = null;

            if (win.loadedObjectType == "app") {

              result.data.push({
                    module : win.getAppClassName(),
                    data : win.loadedObject.getStateData(),
                    currentState : win.currentState,
                    loadedObjectType : win.loadedObjectType
                  });

            } else if (win.loadedObjectType == "link") {

              result.data.push({
                    link : win.linkToLoad,
                    loadedObjectType : win.loadedObjectType
                  });
            }
          }
        }
        result.tabheader = me.tabheader;
        result.columnWidth = me.columnWidth;
        result.refreshCycle = me.refreshCycle;

        return result;
      },
      initComponent : function() {
        var me = this;
        me.menuItems = {
          'Refresh Plots' : -1,
          'Disable' : 0,
          'Each 15m' : 60000, // 900000
          'Each hour' : 3600000,
          'Each day' : 86400000
        };
        me.callParent(arguments);
      },
      addImage : function(img) {
        var me = this;
        var width = 99 / me.columnWidth;
        width = '.' + Math.round(width);

        Ext.apply(img, {
              columnWidth : width
            });
        me.add(img);
        me.addClickEvent(img);

      },
      addClickEvent : function(img) {
        var el = img.getEl();
        if (el) {
          el.on('click', function(e, t, eOpts, me) {
                var me = this;
                var img = me.getImage(t.id);
                if (img) {
                  me.selectImage(img);
                  var oParams = img.plotParams;
                }

              }, this);
          el.on('contextmenu', function(e, t, eOpts) {
                e.stopEvent(); // we do not want to see the browser context
                // menu!
                contextMenu = Ext.create('Ext.menu.Menu', {
                      scope : this,
                      items : [{
                            text : "Open",
                            scope : this,
                            handler : function() {
                              var me = this;
                              me.fullSizeImage(img);
                            }
                          }, {
                            text : "Save",
                            handler : function() {
                              window.open(img.src);
                            }
                          }, {
                            text : "Delete",
                            scope : this,
                            handler : function() {
                              var me = this;
                              me.removeImage(img.id);
                            }
                          }]
                    })
                contextMenu.showAt(e.getXY());
              }, this);
          el.on('dblclick', function(e, t, eOpts) {
                var me = this;
                console.log(me);
                GLOBAL.APP.MAIN_VIEW.getRightContainer().openApplication(t.id);
              }, this);
        } else {
          alert('Cannot add click event to the image!');
        }
      },
      unselectImage : function(img) {
        if (img) {
          img.getEl().fadeIn({
                opacity : 100
              });// , duration: 2000});
          img.selected = false;
        }
      },
      selectImage : function(img) {
        var me = this;
        if (img) {
          img.getEl().frame("#ff0000", 2);
          if (img.selected) {
            img.getEl().fadeIn({
                  opacity : 100
                });// , duration: 2000});
            img.selected = false;
          } else {
            img.getEl().fadeIn({
                  opacity : .65
                });// , duration: 2000});
            img.selected = true;
          }
        }
        me.unselectImage(me.lastClickedImage);
        me.lastClickedImage = img; // the last clicked always the active
        // selection.
      },
      getImage : function(id) {
        var me = this;
        var img = me.getComponent(id);
        return img;
      },
      removeImage : function(id) {
        var me = this;
        me.remove(id);
        me.doLayout();
      },
      getLastClickedImage : function() {
        var me = this;
        return me.lastClickedImage;
      },
      replaceImage : function(oimgid, img) {
        var me = this;
        var oImg = me.getComponent(oimgid);
        oImg.setSrc(img.src);
      },
      setColumnWidth : function(column) {
        var me = this;
        if (me.layout.type == 'table') {
          me.layout.columns = column;
          me.columnWidth = column;
        } else {
          me.columnWidth = column;
          width = Math.floor(99 / column);
          width = width - 1;
          width = '.' + width;
          me.items.each(function(value, index) {
                value.columnWidth = width;
              });
          me.doLayout();
        }
      },
      fullSizeImage : function(img) {
        var html = '<img src="' + img.src + '" />';
        var win = new Ext.Window({
              collapsible : true,
              constrain : true,
              constrainHeader : true,
              html : html,
              layout : 'fit',
              minHeight : 200,
              minWidth : 320,
              title : img.title
            });
        win.show();
      },
      setRefreshCycle : function(time) {
        var me = this;
        if (time != -1) {
          me.refreshCycle = time;
        }
        if (time == -1) {
          me.items.each(function(value, index) {
                var src = value.src.split('&nocache')[0];
                src += "&nocache=" + (new Date()).getTime();
                value.setSrc(src);
              });
        } else if (time == 0) {
          me.items.each(function(value, index) {
                clearInterval(value.refreshTimeout);
              });
        } else {
          me.items.each(function(value, index) {
                clearInterval(value.refreshTimeout);
                value.refreshTimeout = setInterval(function() {
                      var src = value.src.split('&nocache')[0];
                      src += "&nocache=" + (new Date()).getTime();
                      value.setSrc(src);
                    }, time);
              });

        }
      },
      isExist : function(state) {
        var me = this;
        var exist = false;
        me.items.each(function(value, index) {
              if (value.title == state) {
                exist = true;
                return;
              }
            });
        return exist;
      },
      setApplicationsHeader : function(value) {
        var me = this;
        for (var i = 0; i < me.items.length; i++) {
          var tab = me.items.getAt(i);
          if (value == true) {
            tab.header.show();
          } else {
            tab.header.hide();
          }

        }
      }
    });