import * as  jQuery from "jquery";
import { IBaseFormModifications } from "../Base";
import { HideFormField } from "../Util";

const _: IBaseFormModifications = {
    NewForm: () => {
        jQuery("select").filter((i, _ele) => jQuery(_ele).find("option").length === 0).each((i, _ele) => HideFormField(jQuery(_ele).attr("id")));
    },
    EditForm: () => {
        //
    },
    DispForm: () => {
        //
    },
};

export default _;