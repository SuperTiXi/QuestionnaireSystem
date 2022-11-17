/**
 * Created by Amy on 2018/8/13.
 */

var questionnaireId = getCookie("questionnaireId")
$(function () {
    $("#questionNameCount").html( getCookie("QuestionnaireName") + "数量统计");

    var oTable = new TableInit();
    oTable.Init();

//        添加下拉选择问卷
    var selectContent = ''; //下拉选择内容
    jQuery.ajax({
        type: "POST",
        url: httpRequestUrl + "/queryAllQuestionnaireByCreated",
        dataType: 'json',
        contentType: "application/json",
        success: function (result) {
            for (var i = 0; i < result.data.length; i++) {
                selectContent += '<option value="' + result.data[i].id + '">' + result.data[i].questionName + '</option>'
            }
            $("#ddlActivitynew").html(selectContent)
            $("#ddlActivitynew option[value='"+getCookie("questionId") +"']").attr("selected","selected");
        }
    });
    getQuestionnaireCount();
});

//    切换问卷
$("#ddlActivitynew").change(function () {
    var activity = $(this).val();
    var nameQuestion =  $(this)[0].selectedOptions[0].innerHTML;
    if (activity) {
        deleteCookie("questionId");
        setCookie("questionId", activity)
        deleteCookie("nameOfQuestionnaire");
        setCookie("nameOfQuestionnaire", nameQuestion)
        $("#questionNameCount").html( getCookie("nameOfQuestionnaire") + "数量统计");
        getQuestionnaireCount();
        getQuestionnaireAboutSchool();
    }
})

// XXX问卷数量统计
function getQuestionnaireCount() {
    var url = '/queryQuestionnaireCount';
    var data = {
        "questionId": getCookie("questionId")
    };
    commonAjaxPost(true, url, data, function (result) {
        if (result.code == "666") {
            $("#example1Tr1").empty();
            var questCountData = result.data;
            var text = "";
            text += "<tr>";
            text += "<td>" + questCountData.dataName + "</td>";
            text += "<td>" + questCountData.questionCount + "</td>";
            text += "<td>" + questCountData.answerTotal + "</td>";
            if (questCountData.answerRate == "�") {
                text += "<td>-</td>";
            } else {
                text += "<td>" + questCountData.answerRate + "</td>";
            }
            text += "<td>" + questCountData.effectiveAnswer + "</td>";
            text += "</tr>";
            $("#example1Tr1").append(text);

        } else if (result.code == "333") {
            layer.msg(result.message, {icon: 2});
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1000)
        } else {
            layer.msg(result.message, {icon: 2})
        }
    })
}





function TableInit() {

    var oTableInit = new Object();
    //初始化Table
    oTableInit.Init = function () {
        $('#countTable').bootstrapTable({
            url: httpRequestUrl + '/release/queryQuestionnaireById?=questionnaireId='+questionnaireId,         //请求后台的URL（*）
            method: 'GET',                      //请求方式（*）
            striped: true,                      //是否显示行间隔色
            pagination: true,                   //是否显示分页（*）
            //是否启用排序
            sortable: true,
            // sortOrder: "asc",                   //排序方式
            queryParamsType: '',//默认值为 'limit',传给服务端的参数为：limit, offset, search, sort, order Else
            dataType: 'json',
            paginationShowPageGo: true,
            showJumpto: true,
            pageNumber: 1, //初始化加载第一页，默认第一页
            queryParams: queryParams,//请求服务器时所传的参数
            sidePagination: 'server',//指定服务器端分页
            pageSize: 100,//单页记录数
            pageList: [100],//分页步进值
            search: false, //是否显示表格搜索，此搜索是客户端搜索，不会进服务端，所以，个人感觉意义不大
            silent: true,
            showRefresh: false,                  //是否显示刷新按钮
            showToggle: false,
            minimumCountColumns: 2,             //最少允许的列数
            uniqueId: "id",                     //每一行的唯一标识，一般为主键列

            columns: [{
                checkbox: true,
                visible: false
            }, {
                field: 'id',
                title: '序号',
                align: 'center',
                formatter: function (value, row, index) {
                    return index + 1;
                }
            },
                {
                    field: 'question',
                    title: '题目',
                    align: 'center',
                    width: '230px',
                    sortable: true
                },
                {
                    field: 'answerNum',
                    title: '答题人数',
                    align: 'center',
                    sortable: true
                }, {
                    field: 'answerTotal',
                    title: '总人数',
                    align: 'center',
                    sortable: true
                }, {
                    field: 'rate',
                    title: '答题率',
                    align: 'center',
                    sortable: true
                }],
            responseHandler: function (res) {
                //console.log(res);
                if (res.code == "666") {
                    var questionnaire = res.data;
                    var questionList = questionnaire.info;

                    var data = {
                        "questionnaireId":questionnaire.id
                    }
                    commonAjaxPost(true,'/answer/getAnswerersCount',data,success)

                    function success(res){
                        for (let i = 0; i < questionList.length - 1; i++) {
                            var object = {
                                'question':questionList[i].questionTitle,
                                'answerNum':questionnaire.answers,
                                'answerTotal':res.data,
                                'rate':(questionnaire.answers)/(res.data)
                            }
                            _$('#countTable').bootstrapTable('insertRow', {index: i, row: object});
                        }
                    }
                }
            }
        });
    };

    // 得到查询的参数
    function queryParams(params) {
        var schoolName = $("#keyWord").val();
        schoolName = schoolName == "" ? null : schoolName;
        var questionId = getCookie("questionId");
        var temp = {   //这里的键的名字和控制器的变量名必须一直，这边改动，控制器也需要改成一样的
            pageNum: params.pageNumber,
            pageSize: params.pageSize,
            questionId: questionId,
            answerBelong: schoolName,
            sortOrder: params.sortOrder,//排序
            sortName: params.sortName//排序字段
        };
        return JSON.stringify(temp);
    }

    return oTableInit;
}





//设计问卷
function designQuestionnaire() {
    var ifDesignQuestionnaire = getCookie("ifDesignQuestionnaire");
    if (ifDesignQuestionnaire == "false") {
        layer.msg("问卷处于运行状态或问卷已发布，不可设计问卷", {icon: 2})
    } else {
        $.cookie("QuestionId", getCookie("questionId"));
        window.open('designQuestionnaire.html?=' + getCookie("questionId"))
    }
}

//发送问卷
function ifSendQuestionnaire() {
    var ifSendQuestionnaire = getCookie("ifSendQuestionnaire");
    if (ifSendQuestionnaire == "false") {
        layer.msg("问卷处于未发送或暂停的状态，不可发送问卷", {icon: 2})
    } else {
        $.cookie("QuestionId", getCookie("questionId"));
        window.location.href = 'sendQuestionnaire.html';
    }
}


//预览问卷
$('#ctl02_hrefView').click(function () {
    window.open('previewQuestionnaire.html?=' + getCookie("questionId"))
});

//回车事件
$(document).keydown(function (event) {
    if (event.keyCode == 13) {
        getQuestionnaireAboutSchool();
    }
});