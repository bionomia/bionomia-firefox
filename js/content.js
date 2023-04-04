/*global chrome, Object, alert */
var Bionomia = (function($, window, document) {

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
              self.vars.recorded += "<p>";
              self.vars.recorded += self.makeName(this);
              self.vars.recorded += "</p>";
            });
            $.each(request.params.data.identified, function() {
              self.vars.identified += "<p>";
              self.vars.identified += self.makeName(this);
              self.vars.identified += "</p>";
            });
            $.each(request.params.data.associatedReferences, function() {
              self.vars.cited += self.makeCited(this);
            });
            checkExist = setInterval(function() {
              if ($('header') && $('header').length) {
                $('.bn-attribution').remove();
                self.makeOccurrenceHTML();
                clearInterval(checkExist);
              }
            }, 125);
          break;
          case 'bn_dataset':
          if (request.params.data["message"] !== undefined && request.params.data.message === "error") {
            $('.bn-dataset').remove();
          } else {
            self.vars.people = request.params.data.users_count;
            self.createDatasetButton();
            self.adjustDatasetCounter();
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
      $('.bn-dataset').remove();
      $('.bn-attribution').remove();
    },

    getGBIFidentifier: function() {
      var path = window.location.pathname,
          identifier = /(?:dataset|occurrence)\/(.+?)(?:\/|$)/;

      try {
        return path.match(identifier)[1];
      } catch(err) {
        return;
      }
    },

    setGBIFidentifier: function(id) {
      this.vars.gbifIdentifier = id;
    },

    createDatasetButton: function() {
      var self = this, checkExist = "";

      if ($('.bn-dataset') === null || $('.bn-dataset').length === 0) {
        if (this.vars.gbifIdentifier !== 0 && !$.isNumeric(this.vars.gbifIdentifier)) {
          checkExist = setInterval(function() {
            if ($('#tabsScrollable') && $('#tabsScrollable').length) {
              if ($('.bn-dataset').length === 0) {
                self.makeDatasetHTML();
              }
              if (self.vars.people || self.vars.people === 0) {
                self.adjustDatasetCounter();
              }
              clearInterval(checkExist);
            }
          }, 125);
        }
      }
    },

    adjustDatasetCounter: function() {
      $('.bn-dataset-counter').html(this.numberWithCommas(this.vars.people));
      if (parseInt(this.vars.people,10) === 1) {
        $('.gb-button--brand--bionomia-label').text(browser.i18n.getMessage("person"));
      }
    },

    numberWithCommas: function(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    makeName: function(data) {
      var response = "";
      response += data.name;
      if (data["sameAs"].includes("Q")) {
        response += " <img src=\"" + browser.runtime.getURL("images/wikidata_16x16.png") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      } else {
        response += " <img src=\"" + browser.runtime.getURL("images/orcid_16x16.gif") + "\" width=\"16\" height=\"16\" alt=\"iD icon\" border=\"0\">";
      }
      response += " <a href=\"" + data["sameAs"] + "\">" + data["sameAs"] + "</a><br>";
      return response;
    },

/*
REMOVED for now until semantics are better handled
    makeAttributor: function(data, owner) {
      var response = "";
      if (data["sameAs"] === owner) {
        response += "<span style=\"font-size:x-small\">" + browser.i18n.getMessage("claimed_by") + ":";
      } else {
        response += "<span style=\"font-size:x-small\">" + browser.i18n.getMessage("attributed_by") + ":";
      }
      response += data.name;
      if (data["sameAs"].includes("Q")) {
        response += " <img src=\"" + browser.runtime.getURL("images/wikidata_16x16.png") + "\" width=\"12\" height=\"12\" alt=\"iD icon\" border=\"0\">";
      } else {
        response += " <img src=\"" + browser.runtime.getURL("images/orcid_16x16.gif") + "\" width=\"12\" height=\"12\" alt=\"iD icon\" border=\"0\">";
      }
      response += " <a href=\"" + data["sameAs"] + "\">" + data["sameAs"] + "</a>";
      response += "</span>";
      return response;
    },
*/

    makeCited: function(data) {
      var citation = data["description"] ? data["description"] : "";
      return "<p class=\"bionomia-citation\">" + citation + " <a href=\"" + data["@id"] + "\">" + data["@id"] + "</a></p>";
    },

    makeOccurrenceHTML: function() {
      var title = "";
      if (this.vars.recorded) {
        title = browser.i18n.getMessage("collected_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.recorded + "</div>");
      }
      if (this.vars.identified) {
        title = browser.i18n.getMessage("identified_by");
        $("header").append("<div class=\"bn-attribution\"><h4>" + title + "</h4>" + this.vars.identified + "</div>");
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
      var self = this,
          message = {},
          uuid_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (self.vars.gbifIdentifier !== 0) {
        if ($.isNumeric(self.vars.gbifIdentifier)) {
          message = { gbifID : self.vars.gbifIdentifier };
          browser.runtime.sendMessage({ method : "bn_gbifID", params : message });
        } else if (self.vars.gbifIdentifier.match(uuid_pattern)) {
          message = { gbifDatasetKey : self.vars.gbifIdentifier };
          browser.runtime.sendMessage({ method : "bn_gbifDatasetKey", params : message });
        }
      }
    }

  };

  return {
    init: function() {
      _private.receiveMessages();
      _private.setGBIFidentifier(_private.getGBIFidentifier());
      _private.createDatasetButton();
      _private.sendMessage();
    }
  };

}(jQuery, window, document));

$(function() {
  Bionomia.init();
});
