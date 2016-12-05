(function () {
    'use strict';

    angular
        .module('app')
        .controller('Person.OrgViewController', Controller)
        .directive('personOrgView', Directive);

    function Controller(UserService, PersonService) {
        var vm = this;

        vm.user = null;
        vm.selectedPerson = {};
        vm.persons = [];
        vm.refreshPersons = function(person) {
            if(person && person.length >=2) {
                PersonService.Search(person).then(function(response){
                    vm.persons = response;
                });
            }
        };

        vm.onSelectCallback = function($item, $model){
            
        };

        initController();

        function initController() {
            // get current user
            UserService.GetCurrent().then(function (user) {
                vm.user = user;
            });
        }
    }

    function Directive(PersonService){
        return {
            restrict: 'A',
            scope: {selectedPerson: '='},
            link: function(scope, element, attributes) {
                var id = (scope.selectedPerson && scope.selectedPerson._id) ? scope.selectedPerson._id : null;
                PersonService.GetRoot(id).then(function(data){
                    var chart = organisation_chart(data, "#svgholder");
                });

                scope.$watch(function(){ return scope.selectedPerson; }, function(newVal, oldVal){
                    if(newVal !== oldVal) {
                        var id = (newVal && newVal._id) ? newVal._id : "root";
                        PersonService.GetRoot(id).then(function(data){
                            var chart = organisation_chart(data, "#svgholder");
                        });
                    }
                }, true);

                // Short utility functions go after here
                function shorten_text(my_string) {
                    var max_len = 65
                    if (my_string.length > max_len) {
                        my_string = my_string.substring(0, max_len - 3) + "..."
                    }
                    return my_string
                }

                function collapse(d) {
                    if (d.children) {
                        d._children = d.children;
                        d._children.forEach(collapse);
                        d.children = null; //_children is potential childern, children is displayed children 
                    }
                }

                function expand(d) {
                    var children = (d.children) ? d.children : d._children;
                    if (d._children) {
                        d.children = d._children;
                        d._children = null;
                    }
                    if (children)
                        children.forEach(expand);
                }


                function organisation_chart(all_data, selection_string) {

                    $(selection_string).find('svg').remove();

                    var MIN_HEIGHT = 400
                    var NODE_HEIGHT = 35
                    var NODE_SPACING = 10
                    var FONT_SIZE = 10
                    var LINK_WIDTH = 150

                    var all_data = all_data
                    var duration = 750

                    var selection_string = selection_string

                    var total_height = 400; //Take height and width from size of svg container

                    var total_width = $(selection_string).width();

                    var margin = {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: NODE_HEIGHT
                    };

                    var width = total_width - margin.right - margin.left;
                    var height = total_height - margin.top - margin.bottom;

                    var tree = d3.layout.tree()
                        .size([height, width]);

                    var diagonal = d3.svg.diagonal()
                        .projection(function(d) {
                            return [d.y, d.x];
                        });

                    var svg = d3.select(selection_string).append("svg")
                        .attr("width", total_width)
                        .attr("height", total_height)
                        .append("g")
                        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                    //root stores the currently-displayed org chart
                    var root = all_data; //all_data.tree;
                    root.x0 = height / 2;
                    root.y0 = 0;

                    root.children.forEach(collapse); //On first run collapse all but first two levels

                    //create_profile_card(root)
                    //create_stats_card(root)

                    redraw(root)

                    /*$("#MIN_HEIGHT").on("change", redraw)
                    $("#NODE_HEIGHT").on("change", redraw)
                    $("#NODE_SPACING").on("change", redraw)
                    $("#LINK_WIDTH").on("change", redraw)
                    $("#FONT_SIZE").on("change", redraw)*/

    //For drawing tree starting from a particular node
    function get_root_from_id(userid, tree) {

        var found = tree
        var userid = userid


        function recurse(node) {
            if (node["id"] == userid) {
                found = node
            } else {
                if (node.children) {
                    for (var i = 0; i < node["children"].length; i++) {
                        recurse(node["children"][i])
                    }
                }
            };
        }

        if (tree["id"] == userid) {
            found = tree
        } else {
            recurse(tree)
        }

        return found
    }


    //For changing the currently-displayed orgchart (and the underlying data) to begin with a specific user
    function change_root(userid) {

        root = all_data.tree;

        if (userid != "") {
            root = get_root_from_id(userid, root)
        }


    }


    //To determine the height of the SVG, we want to know the max number of nodes are displayed in parallel (stacked on top of one another)
    function get_max_height() {

        var count_nodes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] //count of nodes at each level
        var gaps = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        var gaps_2 = 0
        var max_level = 0

        function recurse(node, level) {
            var level = level + 1
            max_level = Math.max(level, max_level)

            if (node["children"]) {
                count_nodes[level] += node["children"].length
                gaps[level] += 1
                gaps_2 += 1

                for (var i = 0; i < node["children"].length; i++) {
                    recurse(node["children"][i], level)
                };

            }

        }

        recurse(root, 0)

        var nodes_contribution = Math.max.apply(Math, count_nodes) * (NODE_HEIGHT + NODE_SPACING)
        var gap_contribution = NODE_HEIGHT * gaps_2
        var levels_contribution = (max_level - 1) * (NODE_SPACING + NODE_SPACING)


        return Math.max(nodes_contribution + gap_contribution + levels_contribution, MIN_HEIGHT)

    }


                    //Main redraw for chart
                    function redraw(source) {

                        // Get values of all constants
                        /*IN_HEIGHT = parseFloat($("#MIN_HEIGHT").val())
                        NODE_HEIGHT = parseFloat($("#NODE_HEIGHT").val())
                        NODE_SPACING = parseFloat($("#NODE_SPACING").val())
                        LINK_WIDTH = parseFloat($("#LINK_WIDTH").val())
                        FONT_SIZE = parseFloat($("#FONT_SIZE").val())*/


                        //Does the height need to be updated?
                        var new_height = get_max_height(root)

                        // If getting bigger, immediately make svg bigger 
                        var new_width = (find_depth()) * LINK_WIDTH

                        // Transition to new height and width
                        d3.select(selection_string)
                            .select("svg")
                            .transition()
                            .duration(duration)
                            .attr("height", new_height + margin.top + margin.bottom)
                            .attr("width", new_width + margin.left + margin.right)
                            .transition()

                        tree = d3.layout.tree()
                            .size([new_height, new_width]);


                        // Compute the new tree layout.
                        var nodes = tree.nodes(root).reverse(),
                            links = tree.links(nodes);

                        // Normalize for fixed-depth.
                        nodes.forEach(function(d) {
                            d.y = d.depth * LINK_WIDTH;
                        });

                        // Update the nodes…
                        var node = svg.selectAll("g.node")
                            .data(nodes, function(d, i) {
                                return d._id || (d.id = ++i);
                            });

                        // Enter any new nodes at the parent's previous position.
                        var nodeEnter = node.enter().append("g")
                            .attr("class", "node")
                            .attr("transform", function(d) {
                                return "translate(" + source.y0 + "," + source.x0 + ")";
                            })
                            .on("click", click);


                        nodeEnter.append("circle")
                            .attr("r", 1e-6)
                            .style("fill", function(d) {
                                return d._children ? "lightsteelblue" : "#fff";
                            });


                        var color_scale = d3.scale.linear()
                            .domain([0, 10, 38])
                            .range(["blue", "purple", "red"]);

                        nodeEnter
                            .append("foreignObject")

                        .attr("width", function(d) {
                                return LINK_WIDTH
                            })
                            .attr("height", NODE_HEIGHT)

                        .attr("y", function(d) {
                                return NODE_HEIGHT
                            })
                            .attr("x", "-100")
                            .attr("class", "foo")
                            .append("xhtml:div")

                        .attr("dy", "0")
                            .attr("x", function(d) {
                                return 10
                            })


                        // Transition nodes to their new position.
                        var nodeUpdate = node.transition()
                            .duration(duration)
                            .attr("transform", function(d) {
                                return "translate(" + d.y + "," + d.x + ")";
                            });


                        node.select("foreignObject").attr("height", NODE_HEIGHT)
                        node.select("foreignObject").attr("width", LINK_WIDTH)


                        node
                            .select(".foo")
                            .attr("y", function(d) {
                                return -(NODE_HEIGHT / 2)
                            })
                            .attr("x", function(d) {
                                return -(NODE_HEIGHT / 2)
                            })


                        .html(function(d) {
                                /*var source = d3.select("#foreignobject-template").html();
                                var template = Handlebars.compile(source);

                                var template_data = {}
                                template_data.full_name = d.full_name
                                template_data.job_title = d.job_title
                                template_data.mugshot_url_template = d.mugshot_url_template.replace("200", "200").replace("200", "200")
                                template_data.imgwidth = NODE_HEIGHT + 'px'
                                template_data.imgheight = NODE_HEIGHT + 'px'
                                template_data.totalheight = NODE_HEIGHT + 'px'
                                template_data.textwidth = (LINK_WIDTH - (NODE_HEIGHT) - 20) + "px"
                                template_data.bordercolour = color_scale(d.messages_in_last_180_days)
                                template_data.user_id = d.id
                                template_data.font_size = FONT_SIZE
                                if (NODE_HEIGHT > FONT_SIZE) {
                                    template_data.include_job_title = true
                                } else {
                                    template_data.include_job_title = false
                                }*/


                                var html = '<div class="foreignobject_parent">';
                                html += '<div class="foreignobject_child_img">';
                                html += '<img src="app-content/icon-user.png" class="foreignobject_img" style="width:'+NODE_HEIGHT+'px; height:'+NODE_HEIGHT+'px;" data-id ="'+d._id+'"/>';
                                html += '</div>';
                                html += '<div class="foreignobject_child_text" style="width:'+(LINK_WIDTH - (NODE_HEIGHT) - 20)+'px;" >';
                                html += '<div style="height:'+NODE_HEIGHT+'px; overflow:hidden; display:table-cell; vertical-align: middle; font-size:'+FONT_SIZE+'px" >';
                                html += '<strong>'+d.name+'</strong>';
                                if(d.village){
                                    html += '<br/>' + d.village;
                                }
                                html += '</div>';
                                html += '</div>';
                                html += '</div>';

                                return html
                            })
                            /*.on("mouseover", function(d) {
                                create_profile_card(d)
                                create_stats_card(d)

                            })*/


                        nodeUpdate.select("circle")
                            .attr("r", function(d) {
                                if (d.successful_search) {
                                    return 6
                                }
                                return 4.5
                            })
                            .style("fill", function(d) {
                                if (d.successful_search) {
                                    return "red"
                                }
                                return d._children ? "lightsteelblue" : "#fff";
                            });

                        nodeUpdate.select("text")
                            .style("fill-opacity", 1);

                        // Transition exiting nodes to the parent's new position.
                        var nodeExit = node.exit().transition()
                            .duration(duration)
                            .attr("transform", function(d) {
                                return "translate(" + source.y + "," + source.x + ")";
                            })
                            .remove();

                        nodeExit.select("circle")
                            .attr("r", 1e-6);

                        nodeExit.select("text")
                            .style("fill-opacity", 1e-6);

                        // Update the links…
                        var link = svg.selectAll("path.link")
                            .data(links, function(d) {
                                return d.target._id;
                            });

                        // Enter any new links at the parent's previous position.
                        link.enter().insert("path", "g")
                            .attr("class", "link")
                            .attr("d", function(d) {
                                var o = {
                                    x: source.x0,
                                    y: source.y0
                                };
                                return diagonal({
                                    source: o,
                                    target: o
                                });
                            });

                        // Transition links to their new position.
                        link.transition()
                            .duration(duration)
                            .attr("d", diagonal)


                        // Transition exiting nodes to the parent's new position.
                        link.exit().transition()
                            .duration(duration)
                            .attr("d", function(d) {
                                var o = {
                                    x: source.x,
                                    y: source.y
                                };
                                return diagonal({
                                    source: o,
                                    target: o
                                });
                            })
                            .remove()


                        // Stash the old positions for transition.
                        nodes.forEach(function(d) {
                            d.x0 = d.x;
                            d.y0 = d.y;
                        });

                    }


                    //Used to find a user by a specific id in the tree
                    function tree_search(id) {

                        root = all_data.tree

                        function searchpath_false_all() {

                            function set_false(node) {
                                node.foundpath = false
                                node.successful_search = false
                                if (node._children) {
                                    node._children.forEach(set_false);
                                }

                            }

                            set_false(root)
                        }

                        //Search through the nodes of the organisation chart keeping track of 
                        //the full line management chain for the staff member being searched for


                        //Strategy is to collapse all nodes in the data structure and then open 
                        //them back out one by one 
                        if (root.children) {
                            root.children.forEach(collapse);
                        }
                        collapse(root);

                        //Set every node to have a searchpath property set to false
                        searchpath_false_all()


                        var id = id
                        var found = false


                        function recurse_search(node) {


                            // Don't go any further into the tree if found
                            if (found) {
                                return
                            }

                            node.foundpath = true

                            // Where foundpath = true expand nodes
                            if (node._children) {
                                node.children = node._children;
                                node._children = null
                            }

                            if (node.id == id) {
                                found = true
                                if (node.children) {
                                    node._children = node.children
                                    node.children = null
                                }

                                node.successful_search = true

                                // And display popup data
                                create_profile_card(node)

                                return
                            }


                            if (node.children) {
                                node.children.forEach(recurse_search);
                            }


                            // The code is hit as we 'exit the recursion'
                            // If we've explored this aprt of the tree and are bubbling back up
                            //But we haven't found the node, we need to 'tell the tree'
                            //That this isn't the right found path
                            if (found == false) {
                                node.foundpath = false

                                if (node.children) {
                                    node._children = node.children;
                                    node.children = null
                                }
                            }

                        }

                        recurse_search(root, id)

                        redraw(root);
                    }


                    // Toggle children on click.
                    function click(d) {
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
                            if(d.children == null) {
                                PersonService.GetChildren(d._id).then(function(response){
                                    if(response.length) {
                                        d.children = response;
                                        d.successful_search = false
                                        redraw(d);    
                                    }
                                    
                                });
                            }
                        }

                        d.successful_search = false
                        redraw(d);
                    }

                    //Recursively find the max depth node
                    function find_depth() {

                        var max_depth = 0

                        function recurse_depth(node, current_depth) {

                            max_depth = Math.max(max_depth, current_depth)
                            if (node.children) {
                                for (var i = 0; i < node.children.length; i++) {
                                    recurse_depth(node.children[i], current_depth + 1)
                                };

                            }
                        }


                        recurse_depth(root, 0)

                        return max_depth + 1

                    }

                    function create_profile_card(d) {
                        var div = d3.select(".profile_card")


                        div.html(function(d2) {
                            var source = d3.select("#profile-template").html();
                            var template = Handlebars.compile(source);
                            var html = template(d);
                            return html
                        })

                        $('#orgchart_starting_here').click(function(e) {
                            userid = $(this).attr("data_user_id")
                            change_root(userid)
                            redraw(root)
                        });

                        $('#reset_orgchart').click(function(e) {
                            change_root(all_data.tree.id)
                            root.children.forEach(collapse);
                            redraw(root)
                        });

                        $('#expand_allnodes').click(function(e) {
                            expand(root)
                            redraw(root)
                        });

                        $('#collapse_allnodes').click(function(e) {
                            collapse(root)
                            redraw(root)
                        });
                    }

                    function create_stats_card(d) {
                        var div = d3.select(".stats_card")

                        //Add computed statistics to data
                        d.num_children = get_child_count(d)
                        d.average_statistic_1 = get_mean_from_tree(d, "statistic_1")

                        if (!(isNaN(d3.format(".2f")(d.average_statistic_1)))) {
                            d.average_statistic_1 = d3.format(",.2f")(d.average_statistic_1)
                        }

                        d.sum_statistic_2 = get_sum_from_tree(d, "statistic_2")

                        div.html(function(d2) {
                            var source = d3.select("#stats-template").html();
                            var template = Handlebars.compile(source);
                            var html = template(d);
                            return html
                        })


                    }

                    return {
                        redraw: redraw,
                        tree_search: tree_search
                    }
                }

            }
        };
    }

})();