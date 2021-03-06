/**
 * jQuery behaviors for tenon reports.
 */
(function ($) {
  Drupal.behaviors.tenon_reports = {
    attach: function (context, settings) {
      // Don't run this behavior if the installation profile isn't Open Scholar.
      if (settings.tenon.profile != 'openscholar') {
        return;
      }
      // Setup.
      var menuLinkSel = 'a[data-tenon="page_report"]';
      if ($(menuLinkSel + '.tenon-notifications-processed').length) {
        return;
      }
      $(menuLinkSel).addClass('tenon-notifications-processed');

      // Only continue if we have the hopscotch library defined.
      if (typeof hopscotch == 'undefined' || $('a[data-tenon="page_report"]').length == 0) {
        return;
      }
      // Display the potential existing page results of a previous test.
      Drupal.tenon.generateTestReport(settings, '.tenon-link');

      // Adds our tour overlay behavior with desired effects.
      $('a[data-tenon="page_report"]').click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Close the drawer when we generate the report.
        Drupal.cp_toolbar.drawer_close();

        // Sets up the tour object with appropriate content.
        Drupal.tenon.settings.arrowOffset = 0;
        Drupal.tenon.settings.xOffset = -10;

        // Build the report content for the tested page.
        Drupal.tenon.settlePageReportGeneration(settings);
      });
      // Prevent to trigger unwanted reports on the parent menu link.
      $('a[data-drawer="tenon-drawer"]').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
    }
  };

  Drupal.behaviors.tenon_toolbar = {
    attach: function (context, settings) {
      // Don't run this behavior if the installation profile is Open Scholar.
      // Use it for the "normal" sites.
      if (settings.tenon.profile == 'openscholar') {
        return;
      }
      // Setup.
      $('<li><a tenon-data="parent-link" href="#"><span class="tenon-link">' + Drupal.t('Accessibility Check') + '</span></a></li>').insertAfter('#toolbar-user li.first');

      // Only continue if we have the hopscotch library defined.
      if (typeof hopscotch == 'undefined' || $('a[tenon-data="parent-link"]').length == 0) {
        return;
      }
      // Display the potential existing page results of a previous test.
      Drupal.tenon.generateTestReport(settings, '.tenon-link');

      // Adds our tour overlay behavior with desired effects.
      $('a[tenon-data="parent-link"]').click(function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Sets up the tour object with appropriate content.
        Drupal.tenon.settings.placement = 'bottom';
        Drupal.tenon.settings.arrowOffset = 'center';
        Drupal.tenon.settings.xOffset = -100;

        // Build the report content for the tested page.
        Drupal.tenon.settlePageReportGeneration(settings);
      });
    }
  };

  Drupal.behaviors.tenon_admin_menu = {
    attach: function (context, settings) {
      // Don't run this behavior if the installation profile is Open Scholar.
      // Use it for the "normal" sites if the admin-menu module is enabled.
      if (settings.tenon.profile == 'openscholar' || $('body').hasClass('admin-menu') == false) {
        return;
      }
      // Setup with a timeout delay to be compatible with admin menu that adds
      // the markup in JS.
      // Better way to do this are welcomed.
      setTimeout(function() {
        $('<li class="admin-menu-action"><a tenon-data="parent-link" href="#"><span class="tenon-link">' + Drupal.t('Accessibility Check') + '</span></a></li>').insertAfter('#admin-menu-account li:eq(0)');
        // Only continue if we have the hopscotch library defined.
        if (typeof hopscotch == 'undefined' || $('a[tenon-data="parent-link"]').length == 0) {
          return;
        }
        // Display the potential existing page results of a previous test.
        Drupal.tenon.generateTestReport(settings, '.tenon-link');

        // Adds our tour overlay behavior with desired effects.
        $('a[tenon-data="parent-link"]').click(function (e) {
          e.preventDefault();
          e.stopPropagation();

          // Sets up the tour object with appropriate content.
          Drupal.tenon.settings.placement = 'bottom';
          Drupal.tenon.settings.arrowOffset = 'center';
          Drupal.tenon.settings.xOffset = -100;

          // Build the report content for the tested page.
          Drupal.tenon.settlePageReportGeneration(settings);
        });
      }, 200);
    }
  };

  Drupal.tenon = Drupal.tenon || {
      // Default settings for the report content container.
      settings: {
        title: Drupal.t('Your page accessibility report'),
        placement: "bottom",
        yOffset: -3,
        xOffset: -100,
        arrowOffset: 'center'
      },

      // Displays the results of a previous test.
      generateTestReport: function (settings, selector) {
        // If we have a count of issues reported for the current page, show it.
        if (settings.tenon.issuesCount !== false && settings.tenon.issuesCount !== null) {
          // Format the message based on its structure.
          var issues_class = '';
          if (settings.tenon.issuesCount === 0) {
            issues_class = 'no-issue';
          }
          else {
            issues_class = 'has-issue';
          }
          // Display the count of issues from the previous test.
          var summary_count_placeholder = $('#tenon-report-summary-count');
          if (summary_count_placeholder.length == 0 ) {
            $(selector).append($('<span id="tenon-report-summary-count" class="' + issues_class + '">' + settings.tenon.issuesCount + '</span>'));
          }
          else {
            $(summary_count_placeholder).html(settings.tenon.issuesCount).removeClass('no-issue').removeClass('has-issue').addClass(issues_class);
          }
        }
      },

      // Builds the report content and send the current page to an AJAX call
      // to get the results.
      settlePageReportGeneration: function(settings) {
        var tour = {
          showPrevButton: true,
          scrollTopMargin: 100,
          id: "tenon-notifications",
          steps: [Drupal.tenon.buildItem(settings.tenon.moduleBasePath)]
        };
        // Adjust the rendering to match our needs.
        var hopscotch_selector = '.hopscotch-bubble';
        $(hopscotch_selector).addClass('animated');
        hopscotch.startTour(tour);

        // Trigger the page report for the current URL.
        // Format the URL according to the fact that the
        // URL rewriting is on or off.
        if (settings.tenon.cleanUrl == true) {
          var url = Drupal.settings.basePath + 'tenon/ajax/page?url=' + encodeURI(settings.tenon.url);
        }
        else {
          var url = Drupal.settings.basePath + '?q=tenon/ajax/page&url=' + encodeURI(settings.tenon.url);
        }
        $.get(url).done(function(data) {
          $('.tenon-notifications .hopscotch-content .description').html(data.content);
          $('.tenon-notifications .hopscotch-content .tenon-notifications-readmore').html(data.link);
        });
        // Removes animation for each step and let us to target just this tour in CSS rules.
        $(hopscotch_selector).removeClass('animated').addClass('tenon-notifications');
      },

      /**
       * Format Tour content.
       *
       * @returns {{title: string, content: string, target: Element, placement: string, yOffset: number, xOffset: number}}
       */
      buildItem: function (module_path) {
        // Prepare the output to display inside the tour's content region.
        // Builds a default message to show the user that he has to wait.
        var output = "<div class='feed_item'>";
        output += '<span class="description"><p>' + Drupal.t("Report generation in progress.") + '<br />';
        output += '<img src="' + module_path + '/throbber.gif" /></p></span>';
        output += '<div class="tenon-notifications-readmore"></div>';
        output += '</div>';


        Drupal.tenon.settings.content = output;
        Drupal.tenon.settings.target = document.querySelector('.tenon-link');
        // Returns the item to be added to the tour's (array) `items` property.
        return Drupal.tenon.settings;
      }
    };
})(jQuery);
