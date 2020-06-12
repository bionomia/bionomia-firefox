bionomia/*global chrome, Object, alert */
var BionomiaAttributor = (function($, window, document) {

  "use strict";

  var _private = {

    vars: {
      gbifIdentifier: 0,
      recorded: "",
      identified: "",
      cited: "",
      people: "",
      timeout: 125
    },

    receiveMessages: function() {
      var self = this, checkExist;

      browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        switch(request.method) {
          case 'bn_flush':
            self.flushAll();
            self.setGBIFidentifier(self.getGBIFidentifier());
            self.sendMessage();
          break;
          case 'bn_occurrence':
            $.each(request.params.data.recorded, function() {
              self.vars.recorded += self.makeName(this);
            });
            $.each(request.params.data.identified, function() {
              self.vars.identified += self.makeName(this);
            });
            $.each(request.params.data.associatedReferences, function() {
              self.vars.cited += self.makeCited(this);
            });
            if ($('header').length === 0) {
              checkExist = setInterval(function() {
                if ($('header').length) {
                  $('.bn-attribution').remove();
                  self.makeOccurrenceHTML();
                  clearInterval(checkExist);
                }
              }, 125);
            } else {
              $('.bn-attribution').remove();
              self.makeOccurrenceHTML();
            }
          break;
          case 'bn_dataset':
          if (request.params.data["message"] !== undefined && request.params.data.message === "error") {
            if ($('.bn-dataset').length === 0) {
              checkExist = setInterval(function() {
                if ($('.bn-dataset').length) {
                  $('.bn-dataset').remove();
                  clearInterval(checkExist);
                }
              }, 125);
            } else {
              $('.bn-dataset').remove();
            }
          } else {
            self.vars.people = request.params.data.people;
            checkExist = setInterval(function() {
              if ($('.bn-dataset').length) {
                self.adjustDatasetCounter();
                clearInterval(checkExist);
              }
            }, 125);
          }
          break;
        }
        sendResponse({});
        return true;
      });
    },

    flushAll: function() {
      this.vars.gbifIdentifier = 0;
      this.vars.recorded = "";
      this.vars.identified = "";
      this.vars.cited = "";
      this.vars.people = "";
    },

    getGBIFidentifier: function() {
      var path = window.location.pathname,
          identifier = /(?:dataset|occurrence)\/(.+?)(?:\/|$)/;
      return path.match(identifier)[1];
    },

    setGBIFidentifier: function(id) {
      this.vars.gbifIdentifier = id;
    },

    createDatasetButton: function() {
      var self = this, checkExist = "";

      if ($('.bn-dataset').length === 0) {
        if (this.vars.gbifIdentifier !== 0 && !$.isNumeric(this.vars.gbifIdentifier)) {
          checkExist = setInterval(function() {
            if ($('#tabsScrollable').length) {
              self.makeDatasetHTML();
              clearInterval(checkExist);
            }
          }, 125);
        }
      }
    },

    adjustDatasetCounter: function() {
      $('.bn-dataset-counter').html(this.vars.people.toString());
      if (parseInt(this.vars.people,10) === 1) {
        $('.gb-button--brand--bionomia-label').text(browser.i18n.getMessage("person"));
      }
    },

    makeName: function(data) {
      var response = "";
      response += data.givenName + " " + data.familyName;
      if (data["@id"].includes("Q")) {
        response += " <img src=\"" + browser.runtime.getURL("images/wikidata_16x16.png") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      } else {
        response += " <img src=\"" + browser.runtime.getURL("images/orcid_16x16.gif") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      }
      response += " <a href=\"" + data["@id"] + "\">" + data["@id"] + "</a><br>";
      return response;
    },

    makeCited: function(data) {
      var citation = data["description"] ? data["description"] : "";
      return "<p class=\"bionomia-citation\">" + citation + " <a href=\"" + data["@id"] + "\">" + data["@id"] + "</a></p>";
    },

    makeOccurrenceHTML: function() {
      var title = "";
      if (this.vars.recorded) {
        title = browser.i18n.getMessage("collected_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4><div>" + this.vars.recorded + "</div></div>");
      }
      if (this.vars.identified) {
        title = browser.i18n.getMessage("identified_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4><div>" + this.vars.identified + "</div></div>");
      }
      if (this.vars.cited) {
        title = browser.i18n.getMessage("cited_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.cited + "</div>");
      }
    },

    makeDatasetHTML: function() {
      var html = "", throbber = browser.runtime.getURL("images/ajax-loader.gif");
      html = "<li class=\"tab tab-right ng-scope bn-dataset\">" +
                "<span>" +
                  "<a href=\"https://bionomia.net/dataset/" + this.vars.gbifIdentifier + "\" class=\"gb-button--brand gb-button--bionomia\">" +
                    "<span class=\"bn-dataset-counter\"><img src=\"" + throbber + "\" /></span>" +
                    "<span class=\"gb-button--brand--bionomia-label\">" + browser.i18n.getMessage("people") + "</span>" +
                  "</a>" +
                "</span>" +
              "</li>";
      $("#tabsScrollable").find("div.tabs__actions ul").append(html);
      $("#tabsFixedContainer").find("div.tabs__actions ul").append(html);
    },

    sendMessage: function() {
      var self = this, checkExist = "", message = {};
      if ($.isNumeric(self.vars.gbifIdentifier)) {
        message = { gbifID : self.vars.gbifIdentifier };
        browser.runtime.sendMessage({ method : "bn_gbifID", params : message });
      } else {
        message = { gbifDatasetKey : self.vars.gbifIdentifier };
        browser.runtime.sendMessage({ method : "bn_gbifDatasetKey", params : message });
      }
    },

    responseTimer: function() {
      var self = this, checkExist = "", count = 0;
      if (!$.isNumeric(self.vars.gbifIdentifier)){
        checkExist = setInterval(function() {
          if (++count === self.vars.timeout && $('.bn-dataset').find('img').length) {
            self.sendMessage();
            clearInterval(checkExist);
          } else {
            if (count >= self.vars.timeout*1.5) {
              clearInterval(checkExist);
            }
          }
        }, 125);
      }
    }

  };

  return {
    init: function() {
      _private.receiveMessages();
      _private.setGBIFidentifier(_private.getGBIFidentifier());
      _private.createDatasetButton();
      _private.sendMessage();
      _private.responseTimer();
    }
  };

}(jQuery, window, document));

$(function() {
  BionomiaAttributor.init();
});
